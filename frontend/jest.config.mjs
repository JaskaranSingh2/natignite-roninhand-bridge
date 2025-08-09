/** @type {import('jest').Config} */
const config = {
	testEnvironment: "jsdom",
	preset: "ts-jest",
	moduleNameMapper: {
		"^@/components/(.*)$": "<rootDir>/components/$1",
		"^@/lib/(.*)$": "<rootDir>/lib/$1",
	},
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	testMatch: ["**/__tests__/**/*.test.ts?(x)"],
	testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};
export default config;
