const firebase_admin = require("../Config/FireBase_Configuration.js");
// Access messaging service
const messaging = firebase_admin.messaging();
const db = firebase_admin.firestore();

exports.checkFirebaseConnection = async () => {
  try {
    console.log("Successfully retrieved data from Firestore 00:");
    const snapshot = await db.collection("fahadCollect").get(); // Replace 'test' with your actual collection
    console.log("Successfully retrieved data from Firestore:", snapshot.docs);
  } catch (error) {
    console.error("Error connecting to Firestore:", error);
  }
};

const pushNotificationSingle = async (
  registrationToken,
  notificationPayload,
  customData = {}
) => {
  try {
    const message = {
      token: registrationToken,
      notification: notificationPayload, // Notification message content
      data: customData,
    };

    const response = await messaging.send(message);

    return Promise.resolve(); // Resolve the promise after successful sending
  } catch (error) {
    console.error("Error sending notification:", error);
    return Promise.resolve(); // Reject the promise on error
  }
};

exports.pushNotificationMulti = async (
  registrationToken,
  notificationPayload,
  customData = {}
) => {
  for (const token of registrationToken) {
    await pushNotificationSingle(token, notificationPayload, customData);
    console.log("Notification sent to:", token);
    console.log("notificationPayload:", notificationPayload);
  }
  console.log("All notifications sent!");
};
