class BaseDto {
  constructor(model) {
    Object.assign(this, model);
  }
}

class InfoDto extends BaseDto {
  constructor(model) {
    super({
      surname: model.surname,
      firstname: model.firstname,
      patronymic: model.patronymic ?? "",
      contact: model.contact ?? "",
    });
  }
}

class FullInfoDto extends BaseDto {
  constructor(model) {
    super({
      id: model.user._id,
      login: model.user.login,
      role: model.user.role,
      surname: model.surname,
      firstname: model.firstname,
      patronymic: model.patronymic ?? "",
      contact: model.contact ?? "",
      email: model.user.email ?? "",
      is_active: model.user.is_active,
      createdAt: model.user.createdAt,
    });
  }
}

module.exports = {
  InfoDto,
  FullInfoDto,
};
