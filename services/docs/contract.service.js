const { Contract, User } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const ContractDto = require("../../dtos/docs/contract.dto");

class ContractService {
  async generateContractNumber() {
    const currentYear = new Date().getFullYear();
    const prefix = `${currentYear}-`;

    let lastContract = await Contract.findOne({
      contract_number: { $regex: new RegExp(`^${prefix}`) },
    })
      .sort({ contract_number: -1 })
      .select("contract_number");

    let nextNumber = 1;
    if (lastContract && lastContract.contract_number) {
      const lastNumber = parseInt(
        lastContract.contract_number.split("-")[1],
        10
      );
      nextNumber = lastNumber + 1;
    }

    const contractNumber = `${prefix}${String(nextNumber).padStart(3, "0")}`;
    return contractNumber;
  }

  async generateAppendixNumber(contractId) {
    const contract = await Contract.findById(contractId);

    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }

    return contract.appendices.length + 1;
  }

  async createContract(artistId, percentage) {
    const user = await User.findById(artistId);
    if (user.role !== "artist") {
      throw new ApiError.BadRequest(
        "Регистрация договоров возможна только для артистов"
      );
    }
    const existingContract = await Contract.findOne({ artist: artistId });
    if (existingContract) {
      throw new ApiError.BadRequest("Договор для этого артиста уже существует");
    }

    const contractNumber = await this.generateContractNumber();

    const contract = new Contract({
      contract_number: contractNumber,
      artist: artistId,
      percentage,
    });

    await contract.save();
    return { contract_number: contract.contract_number };
  }

  async createAppendix(artistId) {
    const contract = await Contract.findOne({ artist: artistId });

    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }

    const appendixNumber = await this.generateAppendixNumber(contract._id);
    const appendix = {
      type: "appendix",
      appendix_number: `${contract.contract_number}-${appendixNumber}`,
    };

    contract.appendices.push(appendix);
    await contract.save();

    return {
      appendix_number: appendix.appendix_number,
    };
  }

  async updateContract(artistId, data) {
    const allowedFields = ["percentage", "pdf_key"];
    const updateData = this._filterAllowedFields(data, allowedFields);

    const contract = await Contract.findOneAndUpdate(
      { artist: artistId },
      { $set: updateData },
      { new: true }
    );

    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }

    return new ContractDto(contract);
  }

  async updateAppendix(appendixNumber, data) {
    const allowedFields = ["pdf_key"];
    const updateData = this._filterAllowedFields(data, allowedFields);

    const contract = await Contract.findOne({
      "appendices.appendix_number": appendixNumber,
    });
    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }

    const appendix = contract.appendices.find(
      (item) => item.appendix_number === appendixNumber
    );

    if (!appendix) {
      throw new ApiError.NotFoundError("Приложение не найдено");
    }
    я;
    Object.assign(appendix, updateData);
    await contract.save();

    return appendix;
  }

  async createTermination(artistId) {
    const contract = await Contract.findOne({ artist: artistId });

    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }

    const existingTermination = contract.appendices.find(
      (appendix) => appendix.type === "termination"
    );

    if (existingTermination) {
      throw new ApiError.BadRequest("Расторжение соглашения уже существует");
    }

    const appendixNumber = await this.generateAppendixNumber(contract._id);
    const termination = {
      type: "termination",
      appendix_number: `${contract.contract_number}-${appendixNumber}`,
    };

    contract.appendices.push(termination);
    await contract.save();

    return { appendix_number: termination.appendix_number };
  }

  async confirmTermination(terminationId, pdfKey) {
    const contract = await Contract.findOne({
      "appendices._id": terminationId,
    });

    if (!contract) {
      throw new ApiError.NotFoundError("Расторжение договора не найдено");
    }

    const termination = contract.appendices.id(terminationId);

    if (!termination || termination.type !== "termination") {
      throw new ApiError.NotFoundError("Расторжение договора не найдено");
    }

    termination.pdf_key = pdfKey;
    contract.status = "terminated";
    await contract.save();

    return { message: "Расторжение подтверждено" };
  }

  async getContractByArtistId(artistId) {
    const contract = await Contract.findOne({ artist: artistId });

    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }

    return contract;
  }

  async getAllContracts(filterOptions, sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw new ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, 50);

    const filter = {};

    if (filterOptions.type) {
      filter.appendices = { $elemMatch: { type: filterOptions.type } };
    }

    if (filterOptions.status) {
      filter.status = filterOptions.status;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      filter.contract_number = { $regex: searchRegex };
    }

    const sort = {};
    if (sortOptions.contract_number) {
      sort.contract_number = sortOptions.contract_number === "asc" ? 1 : -1;
    }
    if (sortOptions.createdAt) {
      sort.createdAt = sortOptions.createdAt === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const contracts = await Contract.find(filter)
      .populate({
        path: "artist",
        select: "-hash",
        populate: {
          path: "info",
          model: "Info",
        },
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    if (contracts.length === 0) {
      throw new ApiError.NotFoundError("Договоры не найдены");
    }
    const result = contracts.map((contract) => new ContractDto(contract));

    const total = await Contract.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      data: result,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }
}

module.exports = new ContractService();
