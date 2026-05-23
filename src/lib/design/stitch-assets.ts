export type StitchImageAsset = {
  alt: string;
  height: number;
  src: string;
  width: number;
};

export type StitchAvatarAsset = StitchImageAsset & {
  id: string;
  label: string;
};

export type StitchAvatarActionAsset = StitchImageAsset & {
  id: "google-photo" | "upload-image";
  label: string;
};

export type StitchFlagAsset = StitchImageAsset & {
  code: string;
  id: string;
  label: string;
};

export const stitchLogoAsset = {
  alt: "Logo de Prode 2026",
  height: 512,
  src: "/stitch/logos/prode-2026-logo-stitch.jpg",
  width: 512,
} as const satisfies StitchImageAsset;

export const stitchAvatarAssets = [
  {
    alt: "Avatar pixel de Lionel Messi",
    height: 512,
    id: "messi",
    label: "Messi",
    src: "/stitch/avatars/messi.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Erling Haaland",
    height: 512,
    id: "haaland",
    label: "Haaland",
    src: "/stitch/avatars/haaland.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Julián Álvarez",
    height: 512,
    id: "alvarez",
    label: "Álvarez",
    src: "/stitch/avatars/alvarez.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Jude Bellingham",
    height: 512,
    id: "bellingham",
    label: "Bellingham",
    src: "/stitch/avatars/bellingham.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Mohamed Salah",
    height: 512,
    id: "salah",
    label: "Salah",
    src: "/stitch/avatars/salah.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Emiliano Martínez",
    height: 512,
    id: "dibu",
    label: "Dibu",
    src: "/stitch/avatars/dibu.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Vinícius Júnior",
    height: 512,
    id: "vinicius",
    label: "Vinícius",
    src: "/stitch/avatars/vinicius.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Cristiano Ronaldo",
    height: 512,
    id: "cristiano",
    label: "Cristiano",
    src: "/stitch/avatars/cristiano.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Kylian Mbappé",
    height: 512,
    id: "mbappe",
    label: "Mbappé",
    src: "/stitch/avatars/mbappe.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Diego Maradona",
    height: 512,
    id: "maradona",
    label: "Maradona",
    src: "/stitch/avatars/maradona.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Juan Román Riquelme",
    height: 512,
    id: "riquelme",
    label: "Riquelme",
    src: "/stitch/avatars/riquelme.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Martín Palermo",
    height: 512,
    id: "palermo",
    label: "Palermo",
    src: "/stitch/avatars/palermo.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Ricardo Bochini",
    height: 512,
    id: "bochini",
    label: "Bochini",
    src: "/stitch/avatars/bochini.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Juan Sebastián Verón",
    height: 512,
    id: "veron",
    label: "Verón",
    src: "/stitch/avatars/veron.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Diego Milito",
    height: 512,
    id: "milito",
    label: "Milito",
    src: "/stitch/avatars/milito.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Ariel Ortega",
    height: 512,
    id: "ortega",
    label: "Ortega",
    src: "/stitch/avatars/ortega.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Gabriel Batistuta",
    height: 512,
    id: "batistuta",
    label: "Batistuta",
    src: "/stitch/avatars/batistuta.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Mario Kempes",
    height: 512,
    id: "kempes",
    label: "Kempes",
    src: "/stitch/avatars/kempes.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Fernando Redondo",
    height: 512,
    id: "redondo",
    label: "Redondo",
    src: "/stitch/avatars/redondo.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Claudio Caniggia",
    height: 512,
    id: "caniggia",
    label: "Caniggia",
    src: "/stitch/avatars/caniggia.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Sergio Agüero",
    height: 512,
    id: "aguero",
    label: "Agüero",
    src: "/stitch/avatars/aguero.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Alberto Acosta",
    height: 512,
    id: "acosta",
    label: "Acosta",
    src: "/stitch/avatars/acosta.png",
    width: 512,
  },
  {
    alt: "Avatar pixel de Claudio Tapia",
    height: 512,
    id: "chiqui",
    label: "Chiqui",
    src: "/stitch/avatars/chiqui.png",
    width: 512,
  },
] as const satisfies readonly StitchAvatarAsset[];

export type StitchAvatarId = (typeof stitchAvatarAssets)[number]["id"];

export const defaultStitchAvatar = stitchAvatarAssets[0];

export const stitchAvatarActions = [
  {
    alt: "Ícono pixel para usar foto de Google",
    height: 512,
    id: "google-photo",
    label: "Usar foto de Google",
    src: "/stitch/icons/google-avatar-option.png",
    width: 512,
  },
  {
    alt: "Ícono pixel para subir imagen",
    height: 512,
    id: "upload-image",
    label: "Subir imagen",
    src: "/stitch/icons/upload-avatar-option.png",
    width: 512,
  },
] as const satisfies readonly StitchAvatarActionAsset[];

export type StitchAvatarActionId =
  (typeof stitchAvatarActions)[number]["id"];

export const stitchFlagAssets = {
  "arabia-saudita": {
    alt: "Bandera de Arabia Saudita en estilo Stitch",
    code: "KSA",
    height: 512,
    id: "arabia-saudita",
    label: "Arabia Saudita",
    src: "/stitch/flags/arabia-saudita.png",
    width: 512,
  },
  argentina: {
    alt: "Bandera de Argentina en estilo Stitch",
    code: "ARG",
    height: 512,
    id: "argentina",
    label: "Argentina",
    src: "/stitch/flags/argentina.png",
    width: 512,
  },
  brasil: {
    alt: "Bandera de Brasil en estilo Stitch",
    code: "BRA",
    height: 512,
    id: "brasil",
    label: "Brasil",
    src: "/stitch/flags/brasil.png",
    width: 512,
  },
  dinamarca: {
    alt: "Bandera de Dinamarca en estilo Stitch",
    code: "DIN",
    height: 512,
    id: "dinamarca",
    label: "Dinamarca",
    src: "/stitch/flags/dinamarca.png",
    width: 512,
  },
  francia: {
    alt: "Bandera de Francia en estilo Stitch",
    code: "FRA",
    height: 512,
    id: "francia",
    label: "Francia",
    src: "/stitch/flags/francia.png",
    width: 512,
  },
  mexico: {
    alt: "Bandera de México en estilo Stitch",
    code: "MEX",
    height: 512,
    id: "mexico",
    label: "México",
    src: "/stitch/flags/mexico.png",
    width: 512,
  },
  polonia: {
    alt: "Bandera de Polonia en estilo Stitch",
    code: "POL",
    height: 512,
    id: "polonia",
    label: "Polonia",
    src: "/stitch/flags/polonia.png",
    width: 512,
  },
  serbia: {
    alt: "Bandera de Serbia en estilo Stitch",
    code: "SRB",
    height: 512,
    id: "serbia",
    label: "Serbia",
    src: "/stitch/flags/serbia.png",
    width: 512,
  },
} as const satisfies Record<string, StitchFlagAsset>;

export type StitchFlagId = keyof typeof stitchFlagAssets;
