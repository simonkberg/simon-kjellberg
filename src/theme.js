// @flow strict

const colors = {
  black: '#000',
  white: '#fff',
  silver: '#c0c0c0',
  whitesmoke: '#f5f5f5',
  firebrick: '#b22222',
}

const theme = {
  color: {
    primary: colors.black,
    secondary: colors.white,
    muted: colors.silver,
  },
  background: {
    primary: colors.white,
    secondary: colors.black,
  },
  page: {
    maxWidth: '35rem',
  },
  scrollbar: {
    width: '0.2rem',
    thumb: {
      color: colors.silver,
      radius: '0.1rem',
    },
    track: {
      color: 'transparent',
    },
  },
  terminal: {
    window: {
      backgroundColor: '#0d1f2d',
    },
    topbar: {
      backgroundColor: '#e0e8f0',
      height: '1.875rem',
    },
    controls: {
      close: {
        backgroundColor: '#ff6057',
      },
      minimize: {
        backgroundColor: '#ffbd2e',
      },
      maximize: {
        backgroundColor: '#27c93f',
      },
    },
    content: {
      color: '#f4faff',
      maxHeight: '25rem',
    },
  },
  code: {
    color: {
      inline: colors.firebrick,
      block: colors.black,
    },
    background: colors.whitesmoke,
    border: colors.silver,
  },
  quote: {
    border: colors.whitesmoke,
  },
}

export default theme
export type Theme = typeof theme
