module.exports = class ManagerDto {
  id;
  surname;
  firstname;
  patronymic;
  contact;
  role;

  constructor(model) {
    this.id = model._id;
    this.role = model.role;
    this.surname = model.info.surname;
    this.firstname = model.info.firstname;
    this.patronymic = model.info.patronymic ?? "";
    this.contact = model.info.contact ?? "";
  }
};
