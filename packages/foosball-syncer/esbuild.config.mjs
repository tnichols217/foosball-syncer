import esbuild from "esbuild";
import process from "process";
import {copy} from "esbuild-plugin-copy"

const prod = (process.argv[2] === 'production');

esbuild.build({
	entryPoints: ['./src/index.ts'],
	bundle: true,
	minify: prod,
	format: 'cjs',
	platform: "node",
	target: 'node18',
	logLevel: "info",
	sourcemap: prod ? false : 'inline',
	//TODO replace with font extensions so that they will be built
	loader: {
		'.png': 'dataurl',
		'.css': 'text'
	},
	treeShaking: true,
	outdir: './out/',
    plugins: [
		copy({
			resolveFrom: 'cwd',
			assets: [
				{
					from: ['./src/static/**/*'],
					to: ['./out/'],
				},
			],
			}),
	  ],
}).catch(() => process.exit(1));
