# Drive Shots

[![Build Status](https://travis-ci.org/buehler/drive-shots.svg?branch=master)](https://travis-ci.org/buehler/drive-shots)
[![Build Status](https://ci.appveyor.com/api/projects/status/8w6sde8juw6x3l0j?svg=true)](https://ci.appveyor.com/project/buehler/drive-shots)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![GitHub release](https://img.shields.io/github/release/buehler/drive-shots.svg)](https://github.com/buehler/drive-shots/releases/latest)

Small neat electron app, that takes screenshots, and uploads them to your google drive. After they are uploaded,
the url is shortened (via firebase dynamic links) and then copied to your clipboard.

The app has the capabilities to autostart and does provide a small history of the 10 last uploaded files.

Currently tested on:
- Windows 10
- MacOS 10.12.6
- Ubuntu 16.04

#### Special cases

##### Windows

Right now, the notifications on windows do not work. It seems that the last update (fall creators update) of windows
did kill the notifications. ¯\\_(ツ)_/¯

##### Ubuntu

To see the app icon (and therefore use the app) you need to install the `libappindicator1`. If you don't, you won't
see the app icon in the task bar and cannot authenticate your drive account.

```bash
sudo apt-get install -y libappindicator1
```
