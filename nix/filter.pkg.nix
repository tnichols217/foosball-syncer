{ pkgs, file, name }:

pkgs.stdenv.mkDerivation rec {
  pname = "filter-node-project";
  version = "v1.0.0";

  src = file;

  installPhase = 
  ''

  mkdir -p $out/bin/${name}

  cp -r ./lib/node_modules/${name}/out/* $out/bin/${name}

  '';

  meta = {
    description = "Removed unneeded source files";
    homepage = "https://github.com/tnichols217/bioBarcodesTS";
    license = pkgs.lib.licenses.gpl3;
    platforms = pkgs.lib.platforms.all;
  };
}
