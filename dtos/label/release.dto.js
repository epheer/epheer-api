class BaseDto {
  constructor(model) {
    Object.assign(this, model);
  }
}

class ReleaseDto extends BaseDto {
  constructor(model) {
    super({
      id: model._id,
      artist: model.artist.stage_name,
      name: model.name ?? "",
      type: model.type ?? "single",
      cover: model.cover_key ?? "",
      date: model.date ?? Date.now(),
      feat: model.feat ?? [],
      status: model.status?.label ?? "draft",
    });
  }
}

class FullReleaseDto extends BaseDto {
  constructor(model) {
    super({
      id: model._id,
      artist: {
        stageName: model.artist.stage_name,
        userId: model.artist.user_id,
      },
      name: model.name ?? "",
      type: model.type ?? "single",
      cover: model.cover_key ?? "",
      date: model.date ?? Date.now(),
      feat: model.feat ?? [],
      authors: {
        lyricists: model.authors?.lyricists ?? [],
        producers: model.authors?.producers ?? [],
      },
      status: model.status,
      tracks: model.tracks ?? [],
    });
  }
}

module.exports = {
  ReleaseDto,
  FullReleaseDto,
};
