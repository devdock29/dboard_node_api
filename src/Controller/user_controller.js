const jwt = require("jsonwebtoken");
const News = require("../Models/News.js");
const User = require("../Models/User.js");
const User_activity = require("../Models/User_activity.js");
const Permission = require("../Models/Permission.js");
const LookUp = require("../Models/LookUp.js");
const { success, error } = require("../Response/API-Response.js");
const user_details = require("../Models/User_details.js");
const Excel = require("exceljs");
const path = require("path");
const { pushNotificationMulti } = require("../Utils.js/fireBase.js");

exports.Test_Server = (req, res) => {
  console.log("Login");

  return res.status(200).json(
    success("Server is working Fine.", {
      obj: "Success",
    })
  );
};

exports.Login_User = (req, res) => {
  console.log("Login");

  if (
    !!req.body.user_name == false ||
    !!req.body.password == false ||
    !!req.body.device_token == false ||
    !!req.body.platform == false
  ) {
    return res
      .status(400)
      .json(error("user_name/password/device_token/platform not provided", {}));
  } else if (req.body.user_name.length < 3) {
    return res.status(400).json(error("user_name can't be less than 3", {}));
  } else if (req.body.password.length < 6) {
    return res.status(400).json(error("password can't be less than 6", {}));
  } else {
    var params = {
      UserName: req.body.user_name,
      Password: req.body.password,
    };

    User.FindCurrentRegisteredUser(
      params,

      (err, user) => {
        if (err || user.length < 1) {
          return res
            .status(400)
            .json(
              error("No Account Exists against this user_name/password", {})
            );
        } else if (user.length > 0 && user[0].new_user_req === 1) {
          return (
            res
              .status(400) //403 code implies that access is forbidden
              // due to other reasons, such as insufficient permissions or authentication failure.
              .json(
                error(
                  "Currently your account request is in pending status. Kindly contact your Leader!"
                )
              )
          );
        } else if (user.length > 0) {
          const token = jwt.sign(
            {
              UserID: user[0].id,
              Email: user[0].email,
              UserName: user[0].user_name,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "40d",
            }
          );

          var params2 = {
            DeviceToken: req.body.device_token,
            Platform: req.body.platform,
            UserID: user[0].id,
          };
          User.UpdateTokenInfo(
            params2,

            (err, _data) => {
              if (!err) {
                user[0].device_token = req.body.device_token;
                user[0].platform = req.body.platform;

                return res.status(200).json(
                  success("Login Successfull", {
                    token: token,
                    user: user[0],
                  })
                );
              } else {
                return res.status(400).json(error("Login Unsuccessfull", err));
              }
            }
          );
        } else {
          return res.status(400).json(error("Login Unsuccessfull", {}));
        }
      }
    );
  }
};

exports.Login_UserV2 = (req, res) => {
  console.log("Login V2");

  if (
    !!req.body.user_name == false ||
    !!req.body.password == false ||
    !!req.body.device_token == false ||
    !!req.body.platform == false
  ) {
    return res
      .status(400)
      .json(error("user_name/password/device_token/platform not provided", {}));
  } else if (req.body.user_name.length < 3) {
    return res.status(400).json(error("user_name can't be less than 3", {}));
  } else if (req.body.password.length < 6) {
    return res.status(400).json(error("password can't be less than 6", {}));
  } else {
    var params = {
      UserName: req.body.user_name,
      Password: req.body.password,
    };

    User.FindCurrentRegisteredUser(
      params,

      (err, user) => {
        if (err || user.length < 1) {
          return res
            .status(400)
            .json(
              error("No Account Exists against this user_name/password", {})
            );
        } else if (user.length > 0 && user[0].new_user_req === 1) {
          return (
            res
              .status(400) //403 code implies that access is forbidden
              // due to other reasons, such as insufficient permissions or authentication failure.
              .json(
                error(
                  "Currently your account request is in pending status. Kindly contact your Leader!"
                )
              )
          );
        } else if (user.length > 0) {
          const token = jwt.sign(
            {
              UserID: user[0].id,
              Email: user[0].email,
              UserName: user[0].user_name,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "40d",
            }
          );

          var params2 = {
            DeviceToken: req.body.device_token,
            DeviceInfo: !!req.body.device_info ? req.body.device_info : "",
            Platform: req.body.platform,
            Login_time: new Date().toISOString(),
            Logout_time: new Date().toISOString(),
            UserID: user[0].id,
          };

          User_activity.UpdateTokenInfoV2(params2, (_data) => {
            User_activity.insert_user_activity(params2, (err, _data) => {
              if (!err) {
                return res.status(200).json(
                  success("Login Successfull", {
                    token: token,
                    user: user[0],
                  })
                );
              } else {
                return res.status(400).json(error("Login Unsuccessfull", err));
              }
            });
          });
        } else {
          return res.status(400).json(error("Login Unsuccessfull", {}));
        }
      }
    );
  }
};

exports.Signup_User = (req, res) => {
  console.log("SignUp API called!");

  if (
    (!!req.body.user_name == false && req.body.user_name.length) ||
    !!req.body.password == false ||
    !!req.body.full_name == false
  ) {
    return res
      .status(400)
      .json(error("UserName/Password/FullName not provided", {}));
  } else {
    User.FindCurrentRegisteredUserByUserName(
      req.body.user_name,
      (err, user) => {
        if (err) {
          return res.status(500).json(error("Error Handling Information", err));
        } else if (user.length > 0) {
          return res
            .status(400)
            .json(
              error(
                "This UserName was previously used, Try an alternating UserName or contact support.",
                {}
              )
            );
        } else if (user.length < 1) {
          const newUser = new User({
            email: !!req.body.email ? req.body.email : "",
            password: req.body.password,
            user_name: req.body.user_name,
            full_name: req.body.full_name,
            mobile: !!req.body.mobile ? req.body.mobile : "",
            role: !!req.body.role ? req.body.role : 1,
            new_user_req: !!req.body.new_user_req ? req.body.new_user_req : 1,
          });

          User.Register(newUser, (err, data) => {
            console.log(data);
            console.log("insertedID: ", data.insertId);
            if (data != null) {
              const token = jwt.sign(
                {
                  Email: newUser.email,
                  UserName: newUser.user_name,
                  UserID: data.insertId,
                },
                process.env.JWT_KEY,
                {
                  expiresIn: "40d",
                }
              );
              User.IntersionInPermission(data.insertId, (err) => {
                if (err) {
                  console.log("Err:", err);
                  res.status(400).json(error("NOt a super user"));
                } else {
                  return res.status(200).json(
                    success("Signup Successfull", {
                      token: token,
                      user: newUser,
                    })
                  );
                }
              });
            } else {
              return res
                .status(400)
                .json(error("Some Error Occurred while Creating Player", err));
            }
          });
        } else {
          return res.status(400).json(error("Signup Unsuccessfull", {}));
        }
      }
    );
  }
};

exports.Heart_Beat = (req, res) => {
  console.log("HeartBeat");
  if (!!req.userData.UserID == false) {
    return res.status(400).json(error("User ID (Auth) can't null", {}));
  } else {
    var params = {
      UserID: req.userData.UserID,
    };
    User.FindUserByid(params, (err, user) => {
      if (err) {
        return res.status(200).json(error("Error while fetching User", {}));
      } else if (user.data.length < 1) {
        return res
          .status(400)
          .json(
            error("ID not found, Try an Alternating ID or Contact Support", {})
          );
      }

      let myPermissions = [];
      let userData = [];
      let myNews = [];
      let myGame = [];
      let myTeams = [];
      let myTransactionTypes = [];
      let myShift = [];
      let userTeams = [];
      let userGame = [];
      let userShift = [];
      let Status = [];
      let userdetails = [];

      let firstPromise = () => {
        var params = {
          UserID: req.userData.UserID,
        };
        return new Promise((resolve) => {
          Permission.GetAllPermission(params, (err, PermissionData) => {
            if (err) {
              myPermissions = [];
            } else {
              myPermissions = PermissionData;
            }
            resolve("Completed!");
          });
        });
      };

      let secondPromise = () => {
        return new Promise((resolve) => {
          News.GetAllNews((err, Newsdata) => {
            if (!err) {
              myNews = Newsdata;
            } else {
              myNews = [];
            }
            resolve("Completed!");
          });
        });
      };

      let thirdPromise = () => {
        return new Promise((resolve) => {
          LookUp.GetAllGame((err, GamesData) => {
            if (!err) {
              myGame = GamesData;
            } else {
              myGame = [];
            }
            resolve("Completed!");
          });
        });
      };

      let forthPromise = () => {
        return new Promise((resolve) => {
          LookUp.GetAllTeams((err, TeamsData) => {
            if (!err) {
              myTeams = TeamsData;
            } else {
              myTeams = [];
            }
            resolve("Completed!");
          });
        });
      };

      let fifthPromise = () => {
        return new Promise((resolve) => {
          LookUp.GetAllTransactionTypes((err, TransactionTypesData) => {
            if (!err) {
              myTransactionTypes = TransactionTypesData;
            } else {
              myTransactionTypes = [];
            }
            resolve("Completed!");
          });
        });
      };

      let sixthPromise = () => {
        return new Promise((resolve) => {
          LookUp.GetAllShift((err, ShiftData) => {
            if (!err) {
              myShift = ShiftData;
            } else {
              myShift = [];
            }
            resolve("Completed!");
          });
        });
      };

      let seventhPromise = () => {
        var params = {
          UserID: req.userData.UserID,
        };
        return new Promise((resolve) => {
          LookUp.GetAllUserTeams(params, (err, userTeamsData) => {
            if (!err) {
              userTeams = userTeamsData;
            } else {
              userTeams = [];
            }
            resolve("Completed!");
          });
        });
      };

      let eigthPromise = () => {
        var params = {
          UserID: req.userData.UserID,
        };
        return new Promise((resolve) => {
          LookUp.GetAllUserShift(params, (err, userShiftData) => {
            if (!err) {
              userShift = userShiftData;
            } else {
              userShift = [];
            }
            resolve("Completed!");
          });
        });
      };

      let ninethPromise = () => {
        var params = {
          UserID: req.userData.UserID,
        };
        return new Promise((resolve) => {
          LookUp.GetAllUserGame(params, (err, userGameData) => {
            if (!err) {
              userGame = userGameData;
            } else {
              userGame = [];
            }
            resolve("Completed!");
          });
        });
      };

      let tenthPromise = () => {
        return new Promise((resolve) => {
          LookUp.GetAllStatus((err, status) => {
            if (!err) {
              Status = status;
            } else {
              Status = [];
            }
            resolve("Completed!");
          });
        });
      };
      let elventhPromise = () => {
        var params = {
          UserID: req.userData.UserID,
        };
        return new Promise((resolve) => {
          User.UserData(params, (err, userdata) => {
            if (!err) {
              userData = userdata;
            } else {
              userData = [];
            }
            resolve("Completed!");
          });
        });
      };
      let twelvethPromise = () => {
        var params = {
          UserID: req.userData.UserID,
        };
        return new Promise((resolve) => {
          user_details.Get_All_User_Details(params, (err, userdetailsdata) => {
            if (!err) {
              userdetails = userdetailsdata[0].flags !== 0;
            } else {
              userdetails = false;
            }
            resolve("Completed!");
          });
        });
      };

      // Async function to perform execution of all promise
      let promiseExecution = async () => {
        let promise = await Promise.all([
          firstPromise(),
          secondPromise(),
          thirdPromise(),
          forthPromise(),
          fifthPromise(),
          sixthPromise(),
          seventhPromise(),
          eigthPromise(),
          ninethPromise(),
          tenthPromise(),
          elventhPromise(),
          twelvethPromise(),
        ]);
        console.log(promise);

        res.status(200).json(
          success(" HeartBeats DAta", {
            user: user.data[0],
            all_notifications_seen: userdetails,
            permission: myPermissions,
            user_data: userData[0],
            user_lookups: {
              game_data: userGame,
              teams: userTeams,
              shift_data: userShift,
            },

            system_lookups: {
              news: myNews,
              game_data: myGame,
              teams: myTeams,
              transaction_types: myTransactionTypes,
              shift_data: myShift,
              status_data: Status,
            },
          })
        );
      };

      // Function call
      promiseExecution();
    });
  }
};

exports.Update_Profile = (req, res) => {
  const pUsername = !!req.body.user_name ? req.body.user_name.trim() : "";

  if (
    !!pUsername == false &&
    !!req.body.password == false &&
    !!req.file == false &&
    !!req.body.email == false &&
    !!req.body.mobile == false &&
    !!req.body.full_name == false
  ) {
    return res
      .status(400)
      .json(error("UserName OR Password OR image OR email must be passed", {}));
  } else {
    var params = {
      UserID: req.userData.UserID,
      user_name: pUsername,
      password: req.body.password,
      image: req.file,
      email: req.body.email,
      mobile: req.body.mobile,
      full_name: req.body.full_name,
    };
    User.Update_Profile(params, (err, _updateprofile) => {
      if (err) {
        return res.status(400).json(error("USER NAME ALREADY IN USE"));
      } else {
        return res.status(200).json(success(" UPDATED"));
      }
    });
  }
};

exports.Chnage_Password = (req, res) => {
  console.log("Chnage_Password");

  if (
    !!req.body.user_name == false ||
    !!req.body.old_password == false ||
    !!req.body.new_password == false
  ) {
    return res
      .status(400)
      .json(error("user_name/old_password/new_password not provided", {}));
  } else if (req.body.old_password == req.body.new_password) {
    return res
      .status(400)
      .json(error("Old Password Same to your's New Password", {}));
  } else if (req.body.new_password.length < 6) {
    return res
      .status(400)
      .json(error("new_password not less then 6 digit", {}));
  } else {
    var params = {
      UserName: req.body.user_name,
      OldPassword: req.body.old_password,
      NewPassword: req.body.new_password,
      UserID: req.userData.UserID,
    };

    User.FindCurrentPasswordUser(
      params,

      (err, data) => {
        if (err || data.length < 1) {
          return res
            .status(400)
            .json(
              error("No Account Exists against this UserName/Password", {})
            );
        } else if (data.length > 0) {
          User.UpdatePasswordInfo(
            params,

            (err, _data) => {
              if (!err) {
                User.LastLoginFCMToken(params, (err, data) => {
                  if (err) {
                    return res.status(400).json(error("FCM Token not found"));
                  }
                  const registrationToken = data.map((obj) => obj.device_token);
                  // data[0]?.device_token; // Access first item and handle potential absence

                  const notificationPayload = {
                    image:
                      "https://banner2.cleanpng.com/20201008/rtv/transparent-google-suite-icon-google-icon-5f7f985ccd60e3.5687494416021975968412.jpg",
                    title: "Alert",
                    body: "Your password has been updated successfully!",
                  };

                  pushNotificationMulti(registrationToken, notificationPayload);
                });

                return res.status(200).json(success("Password Updated!"));
              } else {
                return res.status(400).json(error("Password Not Updated", err));
              }
            }
          );
        }
      }
    );
  }
};

exports.Logout = (req, res) => {
  console.log("Logout");

  if (!!req.body.user_id == false || !!req.body.platform == false) {
    return res.status(400).json(error("user_id/platform not provided", {}));
  } else {
    var params = {
      UserID: req.body.user_id,
      platform: req.body.platform,
      Logout_time: new Date().toISOString(),
      Deviceinfo: !!req.body.DeviceInfo ? req.body.DeviceInfo : "",
    };

    User.Logout(params, (_data) => {
      // if (err || _data.changedRows < 1) {
      //   return res.status(400).json(error("Logout unsuccessful!!"));
      // } else {
      //   if (_data.changedRows == 1) {
      //     return res.status(200).json(error("Logout successfull", err));
      //   }
      //   return res.status(400).json(error("ERROR!!", err));
      // }
      return res.status(200).json(success("Logout successfull", success));
    });
  }
};

exports.Delete_User = (req, res) => {
  console.log("Delete");

  if (!!req.body.user_name == false || !!req.body.password == false) {
    return res.status(400).json(error("user_name/password not provided", {}));
  } else {
    var params = {
      UserName: req.body.user_name,
      Password: req.body.password,
      Deleted_By: !!req.body.deleted_by ? req.body.deleted_by : 1,
      Deleted_Time: new Date().toISOString(),
    };

    User.FindCurrentRegisteredUser(
      params,

      (err, user) => {
        if (err || user.length < 1) {
          return res
            .status(400)
            .json(
              error("No Account Exists against this user_name/password", {})
            );
        } else if (user.length > 0) {
          User.DeletedUser(
            params,

            (err) => {
              if (err) {
                return res
                  .status(400)
                  .json(
                    error(
                      "No Account Exists against this user_name/password",
                      {}
                    )
                  );
              } else {
                return res
                  .status(200)
                  .json(
                    success(
                      "This user_name/password user deleted successfull",
                      {}
                    )
                  );
              }
            }
          );
        } else {
          return res.status(400).json(error("Delete User unsuccessfull", {}));
        }
      }
    );
  }
};
exports.Update_Flags = (req, res) => {
  console.log("Update_Flags");

  if (!!req.userData.UserID == false) {
    return res.status(400).json(error("UserID is mandatory", {}));
  } else {
    var params = {
      UserID: req.userData.UserID,
    };

    user_details.Update_User_Flags_Details(params, (err) => {
      if (!err) {
        return res.status(200).json(success("User Veiw All Notification  :"));
      } else {
        return res.status(400).json(error("ERROR :", { err }));
      }
    });
  }
};
exports.Get_Users_By_Teams_Id = (req, res) => {
  console.log("Get_Users_By_Teams_Id");

  if (!!req.body.team_id == false) {
    return res.status(400).json(error("TeamsID is mandatory", {}));
  } else {
    var params = {
      team_id: req.body.team_id,
    };

    User.Get_Users_By_Teams_Id(params, (err, data) => {
      if (!err) {
        if (!!data && data.length === 0) {
          return res
            .status(200)
            .json(success("NO Users Found for this Teams ID!"));
        } else {
          return res
            .status(200)
            .json(success(`User In This Teams  ${req.body.team_id}:`, data));
        }
      } else {
        return res.status(400).json(error("ERROR :", { err }));
      }
    });
  }
};

const generateFileUrl = (req, fileName) => {
  const serverUrl = req.protocol + "://" + req.get("host");
  return `${serverUrl}/exports/${fileName}`;
};

exports.Export_User_Data = async (req, res) => {
  try {
    var param = {
      user_id: req.body.user_id,
      team_id: req.body.team_id,
      shift_id: req.body.shift_id,
      start_day: req.body.start_day,
      end_day: req.body.end_day,
      data_type: req.body.data_type,
      status: req.body.status,
    };

    User.Get_Users_Data_Excel(param, (err, data) => {
      if (err) {
        console.error("Error exporting user data:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (!Array.isArray(data)) {
        data = [data];
      }
      console.log("Data:", data);

      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Data");

      // Define column headers
      const desiredColumns = [
        { header: "shift_name", key: "shift_name" },
        { header: "teams_name", key: "teams_name" },
        { header: "user_name", key: "user_name" },
        { header: "full_name", key: "full_name" },
        { header: "shift_id", key: "shift_id" },
        { header: "team_id", key: "team_id" },
        { header: "user_id", key: "user_id" },
        { header: "id", key: "id" },
        { header: "team_id", key: "team_id" },
        { header: "start_time", key: "start_time" },
        { header: "end_time", key: "end_time" },
        { header: "status", key: "status" },
        { header: "leaves", key: "leaves" },
        { header: "comments", key: "comments" },
        { header: "created_by", key: "created_by" },
        { header: "created_name", key: "created_name" },
        { header: "deleted_by", key: "deleted_by" },
        { header: "deleted_name", key: "deleted_name" },
        { header: "approved_by", key: "approved_by" },
        { header: "approved_name", key: "approved_name" },
        { header: "modify_by", key: "modify_by" },
        { header: "modify_name", key: "modify_name" },
        { header: "created_time", key: "created_time" },
        { header: "deleted_time", key: "deleted_time" },
        { header: "approved_time", key: "approved_time" },
        { header: "modify_time", key: "modify_time" },
      ];

      worksheet.columns = desiredColumns;

      data.forEach((row) => {
        // Extract the 'attendances' array
        const attendances = row.attendances;

        // Loop over each 'RowDataPacket' in the 'attendances' array
        attendances.forEach((attendance) => {
          const rowData = desiredColumns.map((col) => {
            if (attendance.hasOwnProperty(col.key)) {
              return attendance[col.key];
            } else {
              console.error(
                `Missing property '${col.key}' in row:`,
                attendance
              );
              return null; // or some default value
            }
          });

          worksheet.addRow(rowData);
        });
      });

      const fileName = `data_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, "../exports", fileName);

      workbook.xlsx
        .writeFile(filePath)
        .then(() => {
          console.log("File saved successfully.");
          const fileUrl = generateFileUrl(req, fileName);
          res.status(200).json({ fileUrl });
        })
        .catch((writeErr) => {
          console.error("Error saving Excel file:", writeErr);
          res.status(500).send("Internal Server Error");
        });
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.Push_Global_News = async (req, res) => {
  try {
    if (!!req.body.news_body == false || !!req.body.news_title == false) {
      return res.status(400).json(error("Body / Title are mandatory", {}));
    } else {
      var param = {
        news_body: req.body.news_body,
        news_title: req.body.news_title,
      };

      User.Get_All_Users_FCM(param, (err, data) => {
        if (err) {
          console.error("Err Get_All_Users_FCM:", err);
          res.status(500).send("Internal Server Error");
          return;
        } else {
          const registrationToken = data.map((obj) => obj.device_token);

          const notificationPayload = {
            title: param.news_title,
            body: param.news_body,
          };

          const customData = {
            type: "ALL_NEWS",
            screen: "NEWS",
          };

          pushNotificationMulti(
            registrationToken,
            notificationPayload,
            customData
          );
          return res.status(200).json(success("All notifications sent!", {}));
        }
      });
    }
  } catch (error) {
    console.error("Error Get_All_Users_FCM:", error);
    res.status(500).send("Internal Server Error");
  }
};
