// Kiểm tra localStorage hiện tại
console.log("=== MACI localStorage Debug ===");
console.log("maciAddress:", localStorage.getItem("maciAddress"));
console.log("maciStartBlock:", localStorage.getItem("maciStartBlock"));
console.log(
  "NEXT_PUBLIC_MACI_ADDRESS (env):",
  process.env.NEXT_PUBLIC_MACI_ADDRESS
);

// Kiểm tra tất cả keys có chứa 'maci'
console.log("\n=== All MACI related keys ===");
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.toLowerCase().includes("maci")) {
    console.log(`${key}: ${localStorage.getItem(key)}`);
  }
}
