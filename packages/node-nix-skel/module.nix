{
  dream2nix,
  config,
  lib,
  nixpkgs,
  ...
}: {
  imports = [
    dream2nix.modules.dream2nix.nodejs-package-lock
    dream2nix.modules.dream2nix.nodejs-granular
  ];

  name = "node-nix-skel";
  version = "1.0.0";

  deps = {nixpkgs, ...}: {
    stdenv = nixpkgs.stdenv;
    # inherit
    #   (nixpkgs)
    #   stdenv
    #   ;
  };

  mkDerivation = {
    src = ./.;
  };
}
