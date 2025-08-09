/** @type {import('jest').Config} */
const config = {
	testEnvironment: "jsdom",
	moduleNameMapper: {
		"^@/components/(.*)$": "<rootDir>/components/$1",
		"^@/lib/(.*)$": "<rootDir>/lib/$1",
		"^@/app/(.*)$": "<rootDir>/app/$1",
	},
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	testMatch: ["**/__tests__/**/*.test.ts?(x)"],
	testPathIgnorePatterns: ["/node_modules/", "/.next/"],
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: {
					jsx: "react-jsx",
				},
			},
		],
	},
};
export default config;
