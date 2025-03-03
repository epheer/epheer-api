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
    this.surname = model.user.info.surname;
    this.firstname = model.user.info.firstname;
    this.patronymic = model.user.info.patronymic ?? "";
    this.contact = model.user.info.contact ?? "";
    this.manager = {
      surname: model.manager.info.surname,
      firstname: model.manager.info.firstname,
      patronymic: model.manager.info.patronymic ?? "",
      contact: model.manager.info.contact ?? "",
    };
  }
};
