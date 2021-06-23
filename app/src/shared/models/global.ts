
declare global {
  interface Window {
    VERSION: string;
  }
}

// declare module "@material-ui/core/styles/createBreakpoints" {
//   interface BreakpointOverrides {
//     xs: false;
//     sm: true;
//     md: false;
//     lg: false;
//     xl: false;
//     phone: true;
//     mobile: true;
//     small: true;
//   }
// }

export function neededForGlobal() { }