import type { Theme } from './theme';

// Augment styled-components' DefaultTheme with our app's Theme shape so that
// `theme.colors.primary`, etc. are typed everywhere `styled-components` is used.
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- standard styled-components DefaultTheme augmentation pattern
  export interface DefaultTheme extends Theme {}
}
