# Visual Code Editor for Interactive Cohort Creation

This is a library for interactively creating cohorts with a visual programming language. The library provides React 
Components that can be imported directly from the root:

```typescript
import {Demo} from "@nephro-react/filters"
```

## Requirement
- [Node 20.*](https://nodejs.org/dist/v20.0.0/)
- [A Project with React > 18.*](https://react.dev/learn)
- [Typescript 4.7](https://www.typescriptlang.org/download)

## Development
`cd` into the root directory of the library.

Install the dependencies with:
```bash
npm install
```

If you would like to develop it while testing in a demo you can run:
```bash
cd ./demos/react
npm install
npm run dev
```

This will start a development server on Port `5173`. HMR is supported both in the demo and in the library itself.

Icons are from [SVGRepo](https://www.svgrepo.com/collection/dazzle-line-icons) from the Dazzle Line Icons collection. The Icons are published under the Attribution CC BY License.

### Linting
In the libraries root directory you can run 
```bash
npm run eslint
```
to run the linter.

## Demos
Demos showcase the functionality of the library and are located in the `demos` directory.
### React
A simple React App that imports the library and showcases the main component.

## Building
To create a production build you need to make sure that the dependencies are installed with
```bash
npm install
```

Then you can build the project with
```bash
npm run build
```
which creates the library code in the directory `dist`. 

`react` and `react-dom` are externalized in the build. 
