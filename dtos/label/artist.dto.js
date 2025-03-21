module.exports = class ArtistDto {
  id;
  stage_name;
  surname;
  firstname;
  patronymic;
  contact;
  manager;

  constructor(model) {
    this.id = model.user._id;
    this.stage_name = model.stage_name;
    this.surname = model.surname;
    this.firstname = model.firstname;
    this.patronymic = model.patronymic ?? "";
    this.contact = model.contact ?? "";
    this.manager =
      {
        surname: model.manager.surname,
        firstname: model.manager.firstname,
        patronymic: model.manager.patronymic,
        contact: model.manager.contact,
      } ?? {};
  }
};
