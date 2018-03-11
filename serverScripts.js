
//A simple hashing algorithm. based on the Java hashCode function
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++)
  {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

//Sends user's details to server
var getLoginPayload = new XMLHttpRequest();
getLoginPayload.onreadystatechange = function()
{
  if (getLoginPayload.readyState == 4 && getLoginPayload.status == 200)
  {
    var loginResponse = JSON.parse(this.responseText);
    if(loginResponse["error"] == true)
    {
      alert(loginResponse["message"]);
    }
    else
    {
      localStorage.setItem("JSON", this.responseText);
      location.assign("./main.html");
      //alert("Logged in!");
    }
  }
}

//This function is ran if the user presses the button to log into the site
function loginClick()
{
  var username = document.getElementById("uName").value;
  var password = document.getElementById("pass").value;
  if(username == "" || password == "")
  {
    alert("Please ensure you have entered a username and a password");
  }
  else if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(username)))
  {
    alert("Email is not in the correct format!");
  }
  else
  {
    var hash = new XMLHttpRequest();
    hash.onreadystatechange = function(response)
    {
      if (hash.readyState == 4 && hash.status == 200)
      {
        //The salt is received from the server and used to hash the password
        var saltedPass = password + JSON.parse(this.responseText)["payload"]["salt"];
        var hashedPass = saltedPass.hashCode();
        //The hashed password and email are sent to the login HTTP request
        localStorage.setItem("userType", "user");
        getLoginPayload.open("POST", "http://localhost:5000/login", true);
        getLoginPayload.setRequestHeader("Cache-Control", "no-cache");
        getLoginPayload.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        getLoginPayload.send("email="+username+"&password="+hashedPass);
      }
    }
    //Sends email to server, receives back salt
    hash.open("POST", "http://localhost:5000/salt", true);
    hash.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    hash.setRequestHeader("Cache-Control", "no-cache");
    hash.send("email="+username);
  }
}

//This function is ran if the user tries to sign up to the site
function signupClick()
{
  var emailSignup = document.getElementById("sEmail").value;
  var sPass = document.getElementById("sPass").value;
  var sPhoneNumber = document.getElementById("sPhoneNumber").value;
  if(emailSignup == "" || sPass == "" || sPassCon == "" || sPhoneNumber == "")
  {
    alert("Please ensure you have entered all the information");
  }
  else if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailSignup)))
  {
    alert("Email is not in the correct format!");
  }
  else if (sPass.length < 8)
  {
    alert("Password must be at least 8 characters long!");
  }
  else if (sPass != document.getElementById("sPassCon").value)
  {
    alert("Password and confirmation don't match!");
  }
  else
  {
    var regHash = new XMLHttpRequest();
    regHash.onreadystatechange = function(response)
    {
      if (regHash.readyState == 4 && regHash.status == 200)
      {
        var regSaltedPass = sPass + JSON.parse(this.responseText)["payload"]["salt"];
        var regHashedPass = regSaltedPass.hashCode();
        var register = new XMLHttpRequest();
        register.onreadystatechange = function()
        {
          if (register.readyState == 4 && register.status == 200)
          {
            var registerResponse = JSON.parse(this.responseText);
            if(registerResponse["error"] == true)
            {
              alert(registerResponse["message"]);
            }
            else
            {
              alert("User registered successfully - please login")
            }
          }

        }
        //Sends user's data to the server, replies as to if they are registered
        register.open("POST","http://localhost:5000/register", true);
        register.setRequestHeader("Cache-Control", "no-cache");
        register.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        register.send("email="+emailSignup+"&password="+regHashedPass+"&phoneNumber="+sPhoneNumber);
      }
    }
    //Sends email to server and receives back salt
    regHash.open("POST", "http://localhost:5000/salt", true);
    regHash.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    regHash.setRequestHeader("Cache-Control", "no-cache");
    regHash.send("email="+emailSignup);
  }
}

function addPrescriptionClick() {
  var prescriptionName = document.getElementById("pname").value;
  var startDate = document.getElementById("startDate").value;
  var endDate = document.getElementById("endDate").value;
  var dosage = document.getElementById("dosage").value;
  var frequency = document.getElementById("recurring").value;
  var reminder = document.getElementById("reminder").value;

  if (!dosage)
    dosage = 1;

  if (!reminder)
    reminder = "Time to take your " + prescriptionName + "!";
  reminder += "\nDosage: " + dosage;


  if (!prescriptionName || !startDate || !endDate || !frequency)
    return alert("Please fill mandatory fields!");


  var prescriptionRequest = new XMLHttpRequest();


    prescriptionRequest.open("POST","http://localhost:5000/addpres", true);
    prescriptionRequest.setRequestHeader("Cache-Control", "no-cache");
    prescriptionRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    prescriptionRequest.send("token="+parsedJSONData["payload"]["token"]+"&presName="+prescriptionName+"&startDate="+startDate+"&endDate="+endDate
                             +"&frequency="+frequency+"&reminder="+reminder);


}
