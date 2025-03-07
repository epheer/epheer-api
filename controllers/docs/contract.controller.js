const contractService = require("../../services/docs/contract.service");
const ApiError = require("../../exceptions/api-error");
const { HTTP_STATUS } = require("../../config/http-statuses");

class ContractController {
  #validateRequestBody(data, requiredFields = []) {
    if (Object.keys(data).length === 0) {
      throw new ApiError.BadRequest("Нет данных для изменений");
    }

    for (const field of requiredFields) {
      if (!data[field]) {
        throw new ApiError.BadRequest(`Поле '${field}' обязательно`);
      }
    }
  }

  async createContract(req, res, next) {
    try {
      const artistId = req.params.id;
      const { percentage } = req.body;

      this.#validateRequestBody({ percentage }, ["percentage"]);

      const contractNumber = await contractService.createContract(
        artistId,
        percentage
      );
      res.status(HTTP_STATUS.CREATED).json(contractNumber);
    } catch (error) {
      next(error);
    }
  }

  async createAppendix(req, res, next) {
    try {
      const artistId = req.params.id;
      const appendix = await contractService.createAppendix(artistId);
      res.status(HTTP_STATUS.CREATED).json(appendix);
    } catch (error) {
      next(error);
    }
  }

  async updateContract(req, res, next) {
    try {
      const artistId = req.params.id;
      const data = req.body;

      this.#validateRequestBody(data);

      const contract = await contractService.updateContract(artistId, data);
      res.status(HTTP_STATUS.OK).json(contract);
    } catch (error) {
      next(error);
    }
  }

  async updateAppendix(req, res, next) {
    try {
      const { appendixNumber } = req.params;
      const data = req.body;

      this.#validateRequestBody(data);

      const appendix = await contractService.updateAppendix(
        appendixNumber,
        data
      );
      res.status(HTTP_STATUS.OK).json(appendix);
    } catch (error) {
      next(error);
    }
  }

  async createTermination(req, res, next) {
    try {
      const artistId = req.params.id;
      const termination = await contractService.createTermination(artistId);
      res.status(HTTP_STATUS.CREATED).json(termination);
    } catch (error) {
      next(error);
    }
  }

  async confirmTermination(req, res, next) {
    try {
      const { terminationId } = req.params;
      const { pdfKey } = req.body;

      this.#validateRequestBody({ pdfKey }, ["pdfKey"]);

      const result = await contractService.confirmTermination(
        terminationId,
        pdfKey
      );
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getContractByArtist(req, res, next) {
    try {
      const artistId = req.params.id;
      const contract = await contractService.getContractByArtistId(artistId);
      res.status(HTTP_STATUS.OK).json(contract);
    } catch (error) {
      next(error);
    }
  }

  async getAllContracts(req, res, next) {
    try {
      const { type, status } = req.query;

      const queryOptions = {
        filterOptions: { type, status },
        sortOptions: JSON.parse(req.query.sort || "{}"),
        searchQuery: req.query.search || "",
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      if (isNaN(queryOptions.page) || queryOptions.page < 1) {
        throw new ApiError.BadRequest("Неверный номер страницы");
      }
      if (isNaN(queryOptions.limit) || queryOptions.limit < 1) {
        throw new ApiError.BadRequest("Неверный лимит записей");
      }

      const result = await contractService.getAllContracts(queryOptions);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContractController();
