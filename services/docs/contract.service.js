const { Contract, User } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const ContractDto = require("../../dtos/docs/contract.dto");

class ContractService {
  async #findContractByArtistId(artistId) {
    const contract = await Contract.findOne({ artist: artistId });
    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }
    return contract;
  }

  async #findAppendix(contract, appendixIdentifier) {
    const appendix = contract.appendices.find(
        (item) =>
            item.appendix_number === appendixIdentifier ||
            item._id.equals(appendixIdentifier)
    );
    if (!appendix) {
      throw new ApiError.NotFoundError("Приложение не найдено");
    }
    return appendix;
  }

  async #generateContractNumber() {
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

    return `${prefix}${String(nextNumber).padStart(3, "0")}`;
  }

  async #generateAppendixNumber(contractId) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }
    return contract.appendices.length + 1;
  }

  async createContract(artistId, percentage) {
    const user = await User.findOne({ _id: artistId, role: "artist" });
    if (!user) {
      throw new ApiError.BadRequest(
          "Регистрация договоров возможна только для артистов"
      );
    }

    const existingContract = await Contract.findOne({ artist: artistId });
    if (existingContract) {
      throw new ApiError.BadRequest("Договор для этого артиста уже существует");
    }

    const contractNumber = await this.#generateContractNumber();

    const contract = new Contract({
      contract_number: contractNumber,
      artist: artistId,
      percentage,
    });

    await contract.save();
    return { contract_number: contract.contract_number };
  }

  async createAppendix(artistId) {
    const contract = await this.#findContractByArtistId(artistId);

    const appendixNumber = await this.#generateAppendixNumber(contract._id);
    const appendix = {
      type: "appendix",
      appendix_number: `${contract.contract_number}-${appendixNumber}`,
    };

    contract.appendices.push(appendix);
    await contract.save();

    return { appendix_number: appendix.appendix_number };
  }

  async updateContract(artistId, data) {
    const allowedFields = ["percentage", "pdf_key"];
    const updateData = this.#filterAllowedFields(data, allowedFields);

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
    const updateData = this.#filterAllowedFields(data, allowedFields);

    const contract = await Contract.findOne({
      "appendices.appendix_number": appendixNumber,
    });
    if (!contract) {
      throw new ApiError.NotFoundError("Договор не найден");
    }

    const appendix = await this.#findAppendix(contract, appendixNumber);
    Object.assign(appendix, updateData);
    await contract.save();

    return appendix;
  }

  async createTermination(artistId) {
    const contract = await this.#findContractByArtistId(artistId);

    const existingTermination = contract.appendices.find(
        (appendix) => appendix.type === "termination"
    );
    if (existingTermination) {
      throw new ApiError.BadRequest("Расторжение соглашения уже существует");
    }

    const appendixNumber = await this.#generateAppendixNumber(contract._id);
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
    return await this.#findContractByArtistId(artistId);
  }

  async getAllContracts({
                          filterOptions,
                          sortOptions,
                          searchQuery,
                          page,
                          limit,
                        }) {
    if (page < 1 || limit < 1) {
      throw new ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;

    // Фильтр для основного запроса
    const matchStage = {};

    if (filterOptions.type) {
      matchStage.appendices = { $elemMatch: { type: filterOptions.type } };
    }

    if (filterOptions.status) {
      matchStage.status = filterOptions.status;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      matchStage.contract_number = { $regex: searchRegex };
    }

    // Сортировка
    const sortStage = {};
    if (sortOptions.contract_number) {
      sortStage.contract_number =
          sortOptions.contract_number === "asc" ? 1 : -1;
    }
    if (sortOptions.createdAt) {
      sortStage.createdAt = sortOptions.createdAt === "asc" ? 1 : -1;
    } else {
      sortStage.createdAt = -1;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "artist",
          foreignField: "_id",
          as: "artistInfo",
        },
      },
      { $unwind: "$artistInfo" },
      {
        $lookup: {
          from: "info",
          localField: "artistInfo.info",
          foreignField: "_id",
          as: "artistInfo.info",
        },
      },
      { $unwind: "$artistInfo.info" },

      ...(searchQuery
          ? [
            {
              $match: {
                $or: [
                  { "artistInfo.info.surname": new RegExp(searchQuery, "i") },
                  { "artistInfo.info.firstname": new RegExp(searchQuery, "i") },
                ],
              },
            },
          ]
          : []),
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ];

    const contracts = await Contract.aggregate(pipeline);

    const totalPipeline = [...pipeline.slice(0, 4), { $count: "total" }];
    const totalResult = await Contract.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const result = contracts.map((contract) => new ContractDto(contract));

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

  #filterAllowedFields(data, allowedFields) {
    const filteredData = {};
    for (const key of allowedFields) {
      if (data.hasOwnProperty(key)) {
        filteredData[key] = data[key];
      }
    }
    return filteredData;
  }
}

module.exports = new ContractService();