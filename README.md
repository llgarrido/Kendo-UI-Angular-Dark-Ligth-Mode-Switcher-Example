# Kendo-UI-Angular-Dark-Ligth-Mode-Switcher-Example
Kendo UI Angular Dark/Ligth Mode Switcher Example.

Switching between dark and light theme at runtime.

When the web application starts for the first time, the service implements the default theme of the operating system (dark or light).

There are several ways to switch the theme:

- When requested by the user within the application.
- When requested by the user from the theme configuration in the operating system (through prefers-color-scheme feature CSS media query).

If user chooses the theme mode from the web application its configuration will persist in the local storage.

https://user-images.githubusercontent.com/18642700/128691081-2830009b-bfb9-41ae-bc41-9b1730cbb2da.mp4

I do not recommend preloading the style-sheets of both themes at application startup, in fact, in the example application the required css is loaded at runtime when the service decides which theme to apply.

Instead of configuring angular.json to load both style-sheets at application startup…

	…
	"architect": {
		...
		"build": {
			…
			options: {
			  …
			  "styles": [
				"src/styles\styles.scss",
				"src/styles/kendoui-theme-dark.scss",
				"src/styles/kendoui-theme-dark.scsss"
			  ],
			}
		},
		…
	},
	…
  
  ..we tell angular.json to not include these style-sheets as we are going to only lazy load one of them at a time at runtime:
  
  	…
	"architect": {
		…
		"build": {
			…
			"options": {
			  …
			  "styles": 
				[
					"src/styles/styles.scss",
					{
						"inject": false,
						"input": "src/styles/kendoui-theme-dark.scss",
						"bundleName": "kendoui-dark"
					},
					{
						"inject": false,
						"input": "src/styles/kendoui-theme-light.scss",
						"bundleName": "kendoui-light"
					}
				]
	,
			}
		},
		…
	},
	…
