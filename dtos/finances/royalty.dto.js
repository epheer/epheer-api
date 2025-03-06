module.exports = class RoyaltyDto {
  id;
  surname;
  firstname;
  patronymic;
  contact;
  email;
  active_income;
  percentage;
  status;
  details;

  constructor(model) {
    this.artist = model.artist._id;
    this.surname = model.artist.info.surname;
    this.firstname = model.artist.info.firstname;
    this.patronymic = model.artist.info.patronymic ?? "";
    this.contact = model.artist.info.contact;
    this.email = model.artist.email;
    this.active_income = model.active_income;
    this.percentage = model.contract.percentage;
    this.status = model.status;
    this.details = model.details;
  }
};
