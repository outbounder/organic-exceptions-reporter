# organic-exceptions-reporter

Simple organelle for capturing uncaughtExceptions and for sending them via email

## dna
      
      {
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
      }