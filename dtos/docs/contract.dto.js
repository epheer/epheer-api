module.exports = class ContractDto {
  id;
  surname;
  firstname;
  patronymic;
  contact;
  email;
  contract_id;
  contract_number;
  file;
  percentage;
  appendices;
  status;
  createdAt;

  constructor(model) {
    this.artist_id = model.artist._id;
    this.surname = model.artist.info.surname;
    this.firstname = model.artist.info.firstname;
    this.patronymic = model.artist.info.patronymic ?? "";
    this.contact = model.artist.info.contact;
    this.email = model.artist.email;

    this.id = model._id;
    this.number = model.contract_number;
    this.file = model.pdf_key;
    this.percentage = model.percentage;
    this.appendices =
      model.appendices.map((appendix) => ({
        id: appendix._id,
        type: appendix.type,
        number: appendix.appendix_number,
        file: appendix.pdf_key,
      })) ?? "";
    this.status = model.status;
    this.createdAt = model.createdAt;
  }
};
