{ pkgs, app, name }:
pkgs.dockerTools.buildImage {
  inherit name;
  copyToRoot = pkgs.buildEnv {
    inherit name;
    paths = [ app pkgs.nodejs ];
    pathsToLink = [ "/bin" ];
  };
  config = {
    Cmd = [ "node" "${app}/bin/${name}/index.js" "/env/.env" ];
    Volumes = { "/env" = {}; "/out" = {}; };
    WorkingDir = "${app}/bin/${name}";
  };
}