import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: '#DEE5DC',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: '#FDF8F3',
				foreground: '#2B2B2B',
				primary: {
					DEFAULT: '#A53F2B',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#F3E9DC',
					foreground: '#2B2B2B'
				},
				destructive: {
					DEFAULT: '#EF4444',
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: '#F3E9DC',
					foreground: '#2B2B2B'
				},
				accent: {
					DEFAULT: '#C68B59',
					foreground: '#2B2B2B'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#2B2B2B'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#2B2B2B'
				},
				success: '#22C55E',
				warning: '#F59E0B',
				error: '#EF4444',
				highlight: '#8C6B55',
				iskcon: {
					maroon: '#A53F2B',
					cream: '#F3E9DC',
					dark: '#2B2B2B',
					gold: '#C68B59',
					folder: '#5A3F2B',
					'folder-alt': '#926C4B'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
