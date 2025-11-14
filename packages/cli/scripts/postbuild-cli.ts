import fs from "fs";
import path from "path";

const buildDir = path.join(__dirname, "../build");
const zkeysDir = path.join(buildDir, "zkeys");
const packageJsonSrc = path.join(__dirname, "../package.json");
const packageJsonDest = path.join(buildDir, "package.json");

// Tạo thư mục build nếu chưa có
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
    console.log(" Created build directory");
}

// Tạo thư mục zkeys nếu chưa có
if (!fs.existsSync(zkeysDir)) {
    fs.mkdirSync(zkeysDir);
    console.log("Created build/zkeys directory");
} else {
    console.log("build/zkeys already exists");
}

// Copy package.json vào build
fs.copyFileSync(packageJsonSrc, packageJsonDest);
console.log("📄 Copied package.json to build/");
