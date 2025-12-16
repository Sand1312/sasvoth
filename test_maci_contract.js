// Test MACI contract mới
async function testMaciContract() {
  const maciAddress = localStorage.getItem("maciAddress");
  console.log("Testing MACI at:", maciAddress);

  if (!maciAddress) {
    console.error("No MACI address in localStorage!");
    return;
  }

  try {
    // Test numSignUps() function
    const response = await fetch(
      "https://arbitrum-sepolia-rpc.publicnode.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: maciAddress,
              data: "0x122db153", // numSignUps()
            },
            "latest",
          ],
          id: 1,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("❌ numSignUps() failed:", data.error);
    } else {
      console.log("✅ numSignUps() success:", data.result);
      const numSignups = parseInt(data.result, 16);
      console.log("Number of signups:", numSignups);
    }

    // Test nextPollId() function
    const response2 = await fetch(
      "https://arbitrum-sepolia-rpc.publicnode.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: maciAddress,
              data: "0x2b786571", // nextPollId()
            },
            "latest",
          ],
          id: 2,
        }),
      }
    );

    const data2 = await response2.json();

    if (data2.error) {
      console.error("❌ nextPollId() failed:", data2.error);
    } else {
      console.log("✅ nextPollId() success:", data2.result);
      const nextPollId = parseInt(data2.result, 16);
      console.log("Next poll ID:", nextPollId);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testMaciContract();
