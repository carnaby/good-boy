import { createGlobalStyle } from 'styled-components';

/**
 * App-wide reset + base styles, driven entirely by theme tokens.
 * Rendered once via <Providers> so styles are present in the SSR HTML
 * (no flash of unstyled content).
 */
export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  ul,
  ol,
  figure,
  blockquote {
    margin: 0;
    padding: 0;
  }

  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    min-height: 100vh;
    background: ${({ theme }) => theme.colors.surfacePage};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-family: ${({ theme }) => theme.fontFamily};
    font-size: ${({ theme }) => theme.typography.body.fontSize};
    line-height: ${({ theme }) => theme.typography.body.lineHeight};
    font-weight: ${({ theme }) => theme.typography.body.fontWeight};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  img,
  picture,
  svg,
  video {
    display: block;
    max-width: 100%;
  }

  input,
  button,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ul,
  ol {
    list-style: none;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;
