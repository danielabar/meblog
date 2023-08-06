install:
	npm install --legacy-peer-deps

dev:
	npm run develop

devclean:
	npm run cleanstart

serve:
	npm run servebuild

serve_noclean:
	npm run servebuild_noclean

deploy:
	npm run deploy

format:
	npm run format

test:
	npm test

testw:
	npm test -- --watch

testu:
	npm test -- -u

testc:
	npm test -- --coverage

build:
	npm run build
