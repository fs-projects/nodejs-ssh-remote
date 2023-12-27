const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const axios = require("axios");
const scp2 = require("scp2");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const port = 4000;

app.use(express.json());
app.use(router, cors());
// Enable JSON parsing middleware

// Middleware to log information for every route
app.use((req, res, next) => {
  console.log(`Received request for ${req.method} ${req.url}`);
  next(); // Call the next middleware in the stack
});

// Function to validate SSH connection and copy file
const validateSSHConnection = async () => {
  console.log("validating ssh connection to ssh server...");
  try {
    // Make an HTTP request to the /validate-ssh-connection route
    const response = await axios.get(
      "http://localhost:4000/validate-ssh-connection"
    );

    // Log the response from the route
    console.log(response.data);
  } catch (error) {
    // Log any errors that occur during the request
    console.error("Error invoking /validate-ssh-connection:", error.message);
  }
};

// Invoke the function during server startup
validateSSHConnection();

router.get("/validate-ssh-connection", (req, res) => {
  console.log("inside validate-ssh-connection route handler...");
  // SSH connection details for your Docker container
  const sshConfig = {
    host: "localhost", // or use the IP address of your Docker host
    port: 2222,
    username: "root",
    password: "password", // Set your Docker container's password here
  };

  // Create an SSH connection
  const ssh = new Client();

  ssh.on("ready", () => {
    console.error("inside validate-ssh-connection route handler ON READY...");
    // Use SCP to copy the file from Docker container to Node.js server
    scp2.scp(
      {
        host: "localhost", // or use the IP address of your Docker host
        port: 2222,
        username: "root",
        password: "password", // Set your Docker container's password here
        path: "/test.txt",
      },
      "./",
      (err) => {
        if (err) {
          console.error(
            "inside validate-ssh-connection route handler ON READY ERROR...",
            err
          );
          res.status(500).json({ ssh: "error" });
        } else {
          console.log("File copied successfully");
          res.json({ ssh: "ok" });
        }

        // Close the SSH connection
        ssh.end();
      }
    );
  });

  ssh.on("error", (err) => {
    console.error(
      "inside validate-ssh-connection route handler, ON ERROR...",
      err
    );
    res.status(500).json({ ssh: "error" });
  });

  ssh.connect(sshConfig);
});

router.post("/ssh-all-servers", async (req, res) => {
  // Assuming req.body contains the array of server configurations
  const data = req.body.serverData;
  const serverData = data?.data;
  if (serverData?.length > 0) {
    try {
      // Create a directory to store files
      const statsDir = path.join(__dirname, "stats");
      if (!fs.existsSync(statsDir)) {
        fs.mkdirSync(statsDir);
      }
      const resultArray = [];
      // Use Promise.all to iterate over servers concurrently
      const results = await Promise.all(
        serverData.map(async (server, i) => {
          const connectionDetails = {
            host: server.HOSTNAME,
            port: server.PORT,
            username: server.USERNAME,
            password: server.PASSWORD,
          };
          // Establish SSH connection
          const ssh = new Client();
          await ssh.connect(connectionDetails);
          ssh.on("error", (err) => {
            console.error(
              "inside ssh-all-servers route handler, ON ERROR...",
              err
            );
            res.status(500).json({ ssh: "error" });
          });
          ssh.on("ready", async () => {
            console.log("inside ssh-all-servers route handler, ON READY...");
            // Use SCP to copy file from server to local directory
            const localFilePath = path.join(
              statsDir,
              `${server.HOSTNAME}_${server.PORT}_test.txt`
            );
            return new Promise((resolve, reject) => {
              scp2.scp(
                {
                  host: server.HOSTNAME,
                  port: server.PORT,
                  username: server.USERNAME,
                  password: server.PASSWORD,
                  path: "/test.txt", // Adjust the path as needed
                },
                localFilePath,
                (err) => {
                  if (err) {
                    console.error(
                      `Error copying file from ${server.HOSTNAME}:${server.PORT}`,
                      err
                    );
                    reject(err);
                  } else {
                    console.log(
                      `File copied successfully from ${server.HOSTNAME}:${server.PORT}`
                    );
                    try {
                      // Read the contents of the file
                      fs.readFile(
                        localFilePath,
                        {
                          encoding: "utf-8",
                        },
                        (error, fileData) => {
                          if (error) {
                            console.error(
                              "Error reading file in local directory",
                              err
                            );
                          } else {
                            console.log("file data", fileData, server.HOSTNAME);
                            // Add the file data to the result array
                            resultArray.push({
                              host: server.HOSTNAME,
                              data: fileData,
                            });

                            // Remove the file
                            // fs.unlink(localFilePath, (unlinkErr) => {
                            //   if (unlinkErr) {
                            //     console.error(
                            //       "Error unlinking file",
                            //       unlinkErr
                            //     );
                            //   }
                            // });
                            if (resultArray.length === serverData.length) {
                              // Send the files back to the frontend
                              res.json({ files: resultArray });
                            }
                          }
                        }
                      );
                    } catch (error) {
                      console.log(
                        "Error reading file in local directory",
                        error
                      );
                    }
                    resolve(localFilePath);
                  }
                  ssh.end(); // Close the SSH connection
                }
              );
            });
          });
        })
      );
    } catch (error) {
      console.error("Error during SSH and file transfer:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.json({ error: "no data!" });
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
