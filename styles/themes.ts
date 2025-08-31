
export interface Theme {
  name: string;
  colors: {
    '--color-background': string;
    '--color-foreground': string;
    '--color-card': string;
    '--color-card-foreground': string;
    '--color-primary': string;
    '--color-primary-foreground': string;
    '--color-secondary': string;
    '--color-secondary-foreground': string;
    '--color-muted': string;
    '--color-muted-foreground': string;
    '--color-accent': string;
    '--color-accent-foreground': string;
    '--color-destructive': string;
    '--color-border': string;
    '--color-input': string;
    '--color-ring': string;
  };
  opacity: {
    '--opacity-card': string;
    '--opacity-glass': string;
  };
  styles: {
    '--background-style': string; // For gradients or image URLs
  }
}

const defaultLight: Omit<Theme, 'name'> = {
  colors: {
    '--color-background': '248 247 244', // #F8F7F4
    '--color-foreground': '26 32 44',
    '--color-card': '255 255 255',
    '--color-card-foreground': '26 32 44',
    '--color-primary': '0 128 128', // teal
    '--color-primary-foreground': '255 255 255',
    '--color-secondary': '226 232 240',
    '--color-secondary-foreground': '26 32 44',
    '--color-muted': '241 245 249',
    '--color-muted-foreground': '100 116 139',
    '--color-accent': '96 165 250',
    '--color-accent-foreground': '255 255 255',
    '--color-destructive': '220 38 38',
    '--color-border': '226 232 240',
    '--color-input': '226 232 240',
    '--color-ring': '0 128 128',
  },
  opacity: {
    '--opacity-card': '0.8',
    '--opacity-glass': '0.5',
  },
  styles: {
    '--background-style': 'rgb(var(--color-background))',
  }
};

const defaultDark: Omit<Theme, 'name'> = {
  colors: {
    '--color-background': '26 32 44',
    '--color-foreground': '226 232 240',
    '--color-card': '45 55 72',
    '--color-card-foreground': '226 232 240',
    '--color-primary': '0 255 255', // cyan
    '--color-primary-foreground': '26 32 44',
    '--color-secondary': '55 65 81',
    '--color-secondary-foreground': '226 232 240',
    '--color-muted': '55 65 81',
    '--color-muted-foreground': '156 163 175',
    '--color-accent': '59 130 246',
    '--color-accent-foreground': '255 255 255',
    '--color-destructive': '239 68 68',
    '--color-border': '55 65 81',
    '--color-input': '55 65 81',
    '--color-ring': '0 255 255',
  },
  opacity: {
    '--opacity-card': '0.8',
    '--opacity-glass': '0.3',
  },
  styles: {
    '--background-style': 'rgb(var(--color-background))',
  }
};

const nebulaLight: Omit<Theme, 'name'> = {
  colors: {
    '--color-background': '240 242 255', // Light lavender-white
    '--color-foreground': '20 20 40',
    '--color-card': '255 255 255',
    '--color-card-foreground': '20 20 40',
    '--color-primary': '191 97 229', // Vibrant purple
    '--color-primary-foreground': '255 255 255',
    '--color-secondary': '230 232 248',
    '--color-secondary-foreground': '50 50 80',
    '--color-muted': '240 242 255',
    '--color-muted-foreground': '120 120 150',
    '--color-accent': '255 107 107', // Coral pink
    '--color-accent-foreground': '255 255 255',
    '--color-destructive': '220 38 38',
    '--color-border': '220 222 240',
    '--color-input': '230 232 248',
    '--color-ring': '191 97 229',
  },
  opacity: {
    '--opacity-card': '0.7',
    '--opacity-glass': '0.4',
  },
  styles: {
    '--background-style': 'linear-gradient(135deg, rgb(232, 237, 255) 0%, rgb(240, 232, 255) 100%)',
  }
};

const nebulaDark: Omit<Theme, 'name'> = {
  colors: {
    '--color-background': '18 18 38', // Deep space blue
    '--color-foreground': '230 230 255',
    '--color-card': '30 30 60',
    '--color-card-foreground': '230 230 255',
    '--color-primary': '66 226 195', // Bright teal
    '--color-primary-foreground': '18 18 38',
    '--color-secondary': '45 45 80',
    '--color-secondary-foreground': '210 210 255',
    '--color-muted': '30 30 60',
    '--color-muted-foreground': '150 150 180',
    '--color-accent': '250 128 200', // Electric pink
    '--color-accent-foreground': '18 18 38',
    '--color-destructive': '239 68 68',
    '--color-border': '50 50 90',
    '--color-input': '45 45 80',
    '--color-ring': '66 226 195',
  },
  opacity: {
    '--opacity-card': '0.6',
    '--opacity-glass': '0.2',
  },
  styles: {
    '--background-style': `radial-gradient(ellipse 80% 80% at 50% -20%,rgba(120,119,198,0.3), transparent),
                          linear-gradient(to right, rgb(18, 18, 38), rgb(30, 30, 60))`,
  }
};


export const themes: Record<string, { light: Theme, dark: Theme }> = {
  default: {
    light: { name: '默认', ...defaultLight },
    dark: { name: '默认 (暗色)', ...defaultDark },
  },
  nebula: {
    light: { name: '星云', ...nebulaLight },
    dark: { name: '星云 (暗色)', ...nebulaDark },
  },
};

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
    Object.entries(theme.opacity).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
     Object.entries(theme.styles).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}
