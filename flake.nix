{
  description = "Dev shell";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    gitignore = {
      url = "github:hercules-ci/gitignore.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    dream2nix.url = "github:nix-community/dream2nix";
  };

  outputs = { self, nixpkgs, flake-utils, dream2nix, gitignore }:
    let


      customOut = flake-utils.lib.eachDefaultSystem (system:
        let
          name = "node-nix-skel";
          pkgs = nixpkgs.legacyPackages.${system};

          _callModule = module:
            nixpkgs.lib.evalModules {
              specialArgs = {
                inherit dream2nix;
                packageSets.nixpkgs = import dream2nix.inputs.nixpkgs { inherit system; };
              };
              modules = [module ./settings.nix dream2nix.modules.dream2nix.core];
            };

          # like callPackage for modules
          callModule = module: (_callModule module).config.public;

          packageModuleNames = builtins.attrNames (builtins.readDir ./packages);

          packages =
            nixpkgs.lib.genAttrs packageModuleNames
            (moduleName: callModule "${./packages}/${moduleName}/module.nix");

          dream2nixOut = {
            inherit packages;
          };

        in with pkgs; {
          packages = rec {
            ${name} = packages.${name};
            filtered = pkgs.callPackage ./nix/filter.pkg.nix { file = packages.${name}; inherit name; };
            docker = pkgs.callPackage ./nix/docker.pkg.nix { app = filtered; inherit name; };
            node = packages.${name};
            default = node;
          };
          apps = rec {
            dev = {
              type = "app";
              program = ./nix/scripts/dev.sh;
            };
            devProd = {
              type = "app";
              program = ./nix/scripts/devProd.sh;
            };
            start = {
              type = "app";
              program = ./nix/scripts/start.sh;
            };
            build = {
              type = "app";
              program = ./nix/scripts/build.sh;
            };
            default = dev;
          };
        });
    in
    # dream2nixOut;
    # nixpkgs.lib.recursiveUpdate dream2nixOut customOut;
    customOut;
}