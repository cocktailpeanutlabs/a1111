module.exports = async (kernel) => {
  let repo
  if (kernel.gpu === "amd" && kernel.platform === "win32") {
    repo = "https://github.com/lshqqytiger/stable-diffusion-webui-directml.git"
  } else {
    repo = "https://github.com/AUTOMATIC1111/stable-diffusion-webui"
  }
  let o = {
    run: [{
      method: "shell.run",
      params: { message: `git clone ${repo} app` }
    }, {
      "uri": "./index.js",
      "method": "config",
    }]
  }
  if (kernel.platform === "darwin" && kernel.arch === "x64") {
    // nothing
  } else {
    o.run.push({
      "method": "self.set",
      "params": {
        "app/ui-config.json": {
          "txt2img/Width/value": 1024,
          "txt2img/Height/value": 1024,
        }
      }
    })
  }
  o.run.push({
    "method": "fs.link",
    "params": {
      "drive": {
        "checkpoints": "app/models/Stable-diffusion",
//          "configs": "app/models/Stable-diffusion",
        "vae": "app/models/VAE",
        "loras": [
          "app/models/Lora",
          "app/models/LyCORIS"
        ],
        "upscale_models": [
          "app/models/ESRGAN",
          "app/models/RealESRGAN",
          "app/models/SwinIR"
        ],
        "embeddings": "app/embeddings",
        "hypernetworks": "app/models/hypernetworks",
        "controlnet": "app/models/ControlNet"
      },
      "peers": [
        "https://github.com/cocktailpeanutlabs/comfyui.git",
        "https://github.com/cocktailpeanutlabs/fooocus.git",
        "https://github.com/cocktailpeanutlabs/forge.git"
      ]
    }
  })
  o.run.push({
    "method": "fs.link",
    "params": {
      "drive": {
        "outputs": "app/outputs"
      }
    }
  })
  o.run.push({
    "when": "{{env.SD_INSTALL_CHECKPOINT}}",
    "method": "fs.download",
    "params": {
      "uri": "{{env.SD_INSTALL_CHECKPOINT}}",
      "dir": "app/models/Stable-diffusion"
    }
  })
  o.run = o.run.concat([{
    "method": "shell.run",
    "params": {
      "message": "{{platform === 'win32' ? 'webui-user.bat' : 'bash webui.sh -f'}}",
      "env": {
        "SD_WEBUI_RESTARTING": 1,
      },
      "path": "app",
      "on": [{ "event": "/http:\/\/[0-9.:]+/", "kill": true }]
    }
  }, {
    "method": "notify",
    "params": {
      "html": "Click the 'start' tab to launch the app"
    }
  }])
  if (kernel.platform === 'darwin') {
    o.requires = [{
      platform: "darwin",
      type: "conda",
      name: ["cmake", "protobuf", "rust", "wget"],
      args: "-c conda-forge"
    }]
  }
  return o
}
