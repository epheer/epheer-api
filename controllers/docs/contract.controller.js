const contractService = require("../../services/docs/contract.service");
const ApiError = require("../../exceptions/api-error");
const { HTTP_STATUS } = require("../../config/http-statuses");

class ContractController {
  async createContract(req, res, next) {
    try {
      const artistId = req.params.id;
      const { percentage } = req.body;

      if (!percentage) {
        throw new ApiError.BadRequest("Указание процентовки обязательно");
      }

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

      if (!data) {
        throw new ApiError.BadRequest("Нет данных для изменений");
      }

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

      if (!pdfKey) {
        throw new ApiError.BadRequest("Поле 'pdfKey' обязательно");
      }

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

      const filterOptions = { type, status };
      const sortOptions = req.query.sort || {};
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await contractService.getAllContracts(
        filterOptions,
        sortOptions,
        searchQuery,
        page,
        limit
      );

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContractController();
