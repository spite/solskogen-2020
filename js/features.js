const extensions = document
  .createElement("canvas")
  .getContext("webgl")
  .getSupportedExtensions();

function canDoTexLOD() {
  return extensions.indexOf("EXT_shader_texture_lod") !== -1;
}

function canDoFloatLinear() {
  return (
    !!extensions["OES_texture_float"] &&
    !!extensions["OES_texture_float_linear"]
  );
}

function canDoHalfFloatLinear() {
  return (
    !!extensions["OES_texture_half_float"] &&
    !!extensions["OES_texture_float_half_linear"]
  );
}

export { canDoTexLOD, canDoFloatLinear, canDoHalfFloatLinear };
