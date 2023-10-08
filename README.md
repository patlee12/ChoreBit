# chorebit

Official Releases folder contains a windows, Linux, and Mac executable. If you prefer to build and serve the project your self please follow directions below.

## Project setup

You need to have Node.js and Yarn package manager installed.

Please navigate to the `./certs` folder to setup https certs.

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn electron:serve
```

### Run your unit tests

```
yarn test:unit
```

### Lints and fixes files

```
yarn lint
```

### To make electron build:

need dependencies for Wine and Mono if on linux https://www.electron.build/multi-platform-build#linux

```
yarn run electron:build --linux deb
yarn run electron:build --windows nsis:x64 or ia32


```
