const { ipcRenderer } = require("electron");

document.onreadystatechange = async function () {
  if (document.readyState === "complete") {
    const defaultStages = {
      Checking: "Checking For Updates!", // When Checking For Updates.
      Found: "Update Found!", // If an Update is Found.
      NotFound: "No Update Found.", // If an Update is Not Found.
      Downloading: "Downloading...", // When Downloading Update.
      Unzipping: "Installing...", // When Unzipping the Archive into the Application Directory.
      Cleaning: "Finalizing...", // When Removing Temp Directories and Files (ex: update archive and tmp directory).
      Launch: "Launching...", // When Launching the Application.
    };

    const updateOptions = {
      gitRepo: "DashEngine", // [Required] Your Repo Name
      gitUsername: "blueqwertz", // [Required] Your GitHub Username.

      appName: "DashEngine", //[Required] The Name of the app archive and the app folder.
      appExecutableName: "DashEngine.exe", //[Required] The Executable of the Application to be Run after updating.

      progressBar: document.getElementById("bar"), // {Default is null} [Optional] If Using Electron with a HTML Progressbar, use that element here, otherwise ignore
      label: document.getElementById("message"), // {Default is null} [Optional] If Using Electron, this will be the area where we put status updates using InnerHTML
      stageTitles: defaultStages, // {Default is defaultStages} [Optional] Sets the Status Title for Each Stage
    };

    const uaup = require("uaup-js");

    const isPackaged = require("electron-is-packaged").isPackaged;

    if (!isPackaged) {
      setTimeout(() => {
        ipcRenderer.send("start_app");
      }, 500);
      return;
    }

    let updateAvailabe = await uaup.CheckForUpdates(updateOptions);

    if (updateAvailabe == false) {
      ipcRenderer.send("start_app");
    } else {
      uaup.Update(updateOptions);
    }
  }
};
