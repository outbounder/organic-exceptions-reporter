var _ = require("underscore");
var moment = require("moment");
var format = require("string-template")

/*
  dna.cooldownInterval: Number, miliseconds, default to 10 secs.
  dna.email: {
    transport: String, "sendmail" || "smtp" || "console.log" || "plasma"
    options: { 
      @when transport == "plasma"
        options.chemicalType: String, default "sendEmail"
      @when transport == "smtp"
        options.host: String
        options.port: Number
        options.auth: {
          user: String,
          pass: String
        }
    },
    from: String,
    to: Stirng,
    subject: String, default "Exception {id} - {date}"
  }
  dna.killOn: String, defaults to "kill"
*/
module.exports = function ExceptionsReporter(plasma, dna){
  if(dna.email) {
    var nodemailer = require("nodemailer")
    if(dna.email.transport == "sendmail")
      this.transport = nodemailer.createTransport(require("nodemailer-sendmail-transport")());
    else
    if(dna.email.transport == "console.log") {
      this.transport = {
        sendMail: function(options, next) {
          console.log(options)
          next()
        }
      }
    } else
    if(dna.email.transport == "smtp")
      this.transport = nodemailer.createTransport(dna.email.options)
    else
    if(dna.email.transport == "plasma")
      this.transport = {
        sendMail: function(options, next) {
          var chemical = {type: dna.email.options.chemicalType || "sendEmail"}
          _.extend(chemical, options)
          plasma.emit(chemical, next)
        }
      }
    else
      throw new Error("unknown transport")
  } else
    throw new Error("dna.email is required")

  var id = 0;
  var errorCaptured = false;
  var self = this

  var sendUncaughException = function(err){
    // always increase counter/id of uncaughtExceptions
    id += 1;
    console.info(err)
    // if error has been captured and not 'cooled down' from last error do not send it
    if(errorCaptured) return;
    errorCaptured = true;
    setTimeout(function(){ errorCaptured = false }, dna.cooldownInterval || 10*1000)

    if(self.transport)  { // by pass sending if not present transport
      self.transport.sendMail({
        from: dna.email.from,
        to: dna.email.to,
        subject: format(dna.email.subject || "Exception {id} - {date}", {id: id, date: moment().toString()}),
        text: err.stack.toString()
      }, function(err, response){
        if(err) console.error("DURING SENDING EXCEPTION", err); 
      });
    } else
      console.error("smtpTransport not found for exception reporting during ", err)
  }

  process.on("uncaughtException", sendUncaughException)

  plasma.on(dna.killOn || "kill", function(){
    id = 0
    errorCaptured = false
    process.removeListener("uncaughtException", sendUncaughException)
  })
}