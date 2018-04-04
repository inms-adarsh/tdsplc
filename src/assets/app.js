    // var config = {
    //     apiKey: "AIzaSyC8EqwEttdMv-e-PA9IH7_RFYDU1RGNLYU",
    //     authDomain: "tdsplcs-b1bd6.firebaseapp.com",
    //     databaseURL: "https://tdsplcs-b1bd6.firebaseio.com",
    //     projectId: "tdsplcs-b1bd6",
    //     storageBucket: "gs://tdsplcs-b1bd6.appspot.com",
    //     messagingSenderId: "235899168019"
    // };

    
  // Initialize Firebase
    var config = {
        apiKey: "AIzaSyC5yOz4Dq1K3gzey2DZxe-d733ZUCpFBxM",
        authDomain: "tdsplc-staging.firebaseapp.com",
        databaseURL: "https://tdsplc-staging.firebaseio.com",
        projectId: "tdsplc-staging",
        storageBucket: "gs://tdsplc-staging.appspot.com",
        messagingSenderId: "792874500940"
    };
    firebase.initializeApp(config);
    var rootRef = firebase.database().ref();
