/**
 * Provide an easy interface for creating arbitrarily nested sub-commands.  The
 * LightRoast module will use commander for argv parsing
 */
var LightRoast = function LightRoast(name, config, commander) {
  var isRoot = config.isRoot;

  this._Commander = commander;
  this._commander = new this._Commander.Command();

  // The _executable associated with these commands
  this._executable = (isRoot ? name : '');

  // The keyword used to invoke this command, as in: "coldbrew my-command"
  // where "coldbrew" is the executable
  this.command = (isRoot ? '' : name);

  // A helpful description for this command
  this.description = config.description || '';

  /**
   * Arguments and subcommands are mutually exclusive.  For a command that has
   * subcommands, then the number of other arguments is 0 (because the arguments
   * belong to the subcommands).
   */
  this._arguments = config._arguments || [
    /*{
        name: 'my-arg',
        description: 'It is a cool thing',
        required: true,
        validate: function (val) {
          return true; //or false
        },
        format: function (val) {
          return val;
        }
     }*/
  ];

  /**
   * Recursively generated via the configuration object
   */
  this._subcommands = [];

  /**
   * An array of options that can be fed into commander.  Options that exist at
   * a parent-level are passed down to children during the initialization
   * process
   */
  this._options = config._options || [
    /*{
       flag: 'help',
       shortcut: 'h',
       description: 'Some cool description',
       valueRequired: false,
       value: 'thing',
       type: 'commander-style arg validation',
       defaultValue: ''
     }*/
  ];

  /**
   * A custom array of example text strings.  Each item represents a line, and
   * nested arrays represent an extra indentation level.
   */
  this._examples = config._examples || [
    // 'My example string here'
    // ['nested arrays indicate indentation']
  ];

  /**
   * The code to be executed once this subcommand is actually invoked
   */
  this.exec = config.exec || this.exec;

  // In order to have a nice usage output, child commands need to know the
  // list of commands above them all the way back to the root
  this._commands = [];

  // An array of custom help text that will be used in the output
  this._help = [];

  // Command level - for example "coldbrew bootstrap vpc" - in this context
  // "bootstrap" is the level 1 command (main) and "vpc" is the level 2 command.
  // This lets us know how many arguments to ignore to start the verification for
  // the "right" number of args for this subcommand
  this._level = this._level || 0;

  // Add all of the subcommands before moving on
  this._recursivelyBuildCommands(config);

  // Verify that arguments and subcommands are mutually exclusive
  if (this._arguments.length && this._subcommands.length) {
    throw new Error(
      'You cannot specify both arguments and subcommands within the same command'
    );
  }

  // A flag indicating whether or not this is the command to run or if there are
  // more levels that need to be tested
  this._hasSubcommands = !!this._subcommands.length;

  // Disable errors for unspecified options if this is a parent command - because
  // parent commands are not responsible for defining and parsing options
  if (this._hasSubcommands) {
    this._commander.allowUnknownOption(true);
  }
};

/**
 * Loop through all of the subcommands of this command and construct them as
 * LightRoast instances.
 */
LightRoast.prototype._recursivelyBuildCommands = function _recursivelyBuildCommands(config) {
  var name;

  for (name in config.subcommands) {
    if (config.subcommands.hasOwnProperty(name)) {
      this._subcommands.push(new LightRoast(name, config.subcommands[name], this._Comamnder));
    }
  }
};

/**
 * Set the _executable name for help output purposes.  This needs to be passed
 * from parent to child the same way the command list is.
 */
LightRoast.prototype.setExecutableName = function setExecutableName(_executableName) {
  this._executable = _executableName;
};

/**
 * Allow for better usage messaging by knowing the parent commands
 */
LightRoast.prototype.setParentCommands = function setParentCommands(commands) {
  this._commands = commands;
};

/**
 * Allow for a parent command to set the level of a sub command
 */
LightRoast.prototype.setLevel = function setLevel(level) {
  this._level = level;
};

/**
 * Used by parent commands to pass their options down to child comamnds.  This
 * will cause child options to override parent options for stricter validation
 * and better, context-specific messaging.
 */
LightRoast.prototype.addOptions = function addOptions(options) {
  this._options = options.concat(this._options);
};


/**
 * Use commander to parse the argv array with the appropriate options and
 * types
 */
LightRoast.prototype.parse = function parse(argv, callback) {
  var cmd = this._commander;
  var subcommand = null;
  var needsHelp = false;
  var opts;
  var subcommandKeyword;
  var args;
  var idx;

  // Remove the help flag from the argv array
  // We have to do some fancy magic because of the way that commander handles
  // sub-commands
  if (argv.indexOf('--help') !== -1 || argv.indexOf('-h') !== -1) {
    idx = (argv.indexOf('--help') !== -1 ? argv.indexOf('--help') : argv.indexOf('-h'));
    argv = argv.slice();
    argv.splice(idx, 1);
    needsHelp = true;
  }

  this._setup();
  cmd.parse(argv);

  // Decide whether or not to output the help at this._level, regardless of
  // whether this is a parent or child command
  if (needsHelp) {
    if (cmd.args.length === this._level) {
      return this.outputHelp();
    }

    // Add the help arg back for the next subcommand
    else {
      argv.push('--help');
    }
  }

  // This is the lowest-level command, run the actual command
  if (!this._hasSubcommands) {
    opts = this._generateOptions();
    args = this._parseArgs(this._commander.args);

    // There was something wrong with the number of arguments or they were
    // invalid
    if (args === false) {
      this.outputHelp();
    }
    else {
      this.exec(args, opts, callback);
    }

    return;
  }

  // Find the matching subcommand corresponding to the next argument after this
  // command
  subcommandKeyword = this._commander.args[this._level];
  this._subcommands.every(function (instance) {
    if (subcommandKeyword === instance.command) {
      subcommand = instance;
      return false;
    }

    return true;
  });

  // The subcommand entered was not a registered subcommand
  if (!subcommand) {
    this.outputHelp();
    return callback(true);
  }

  // Setup the subcommand to run
  subcommand.setExecutableName(this._executable);
  subcommand.setParentCommands([].concat(this._commands, [' ' + this.command]));
  subcommand.setLevel(this._level + 1);
  subcommand.addOptions(this._options);
  subcommand.parse(argv, callback);
};

/**
 * Prepare the help output (in case of error)
 */
LightRoast.prototype._setup = function _setup() {
  var _this = this;

  // Generate the help notes
  this._generateHelp();

  // Skip the rest of the initialization process
  if (this._hasSubcommands) {
    return;
  }

  // Setup the CLI for options parsing
  this._options.forEach(function (option) {
    var args = [];
    var optionStr = '-' + option.shortcut + ', --' + option.flag;

    if (option.value) {
      optionStr += ' ' + (option.valueRequired ? '<' + option.value + '>' : '[' + option.value + ']');
    }

    args.push(optionStr);
    args.push(option.description);

    if (option.defaultValue) {
      args.push(option.defaultValue);
    }

    if (option.type && option.defaultValue) {
      args.push(option.type);
    }

    _this._commander.option.apply(_this._commander, args);
  });
};

/**
 * Based on the arguments, options, examples, subcommands,  Create an array
 * (sometimes nested) that represents all of the help messages.
 */
LightRoast.prototype._generateHelp = function _generateHelp() {
  var subcommandKeywords = [];
  var argumentHelp = [];
  var optionsHelp = [];
  var usage = '$> ' + this._executable + ' [options]' +
    this._commands.join(' ') + ' ' + this.command;

  // Remove extraneous whitespace
  usage = usage.replace(/\s+/g, ' ');
  usage = usage.trim();

  if (this._hasSubcommands) {
    this._subcommands.forEach(function (sub) {
      var msg;
      subcommandKeywords.push(sub.command);
      msg = '* ' + sub.command + ' -';

      // Support multi-line descriptions
      if (sub.description instanceof Array) {
        argumentHelp.push(msg);
        argumentHelp.push(sub.description);
      }
      else {
        argumentHelp.push(msg + ' ' + sub.description);
      }
    });

    usage += ' (' + subcommandKeywords.join('|') + ')';
  }
  else {
    this._arguments.forEach(function (arg) {
      var msg;
      var param = (arg.required ? ' <' + arg.name + '>' : ' [' + arg.name + ']');
      usage += param;
      msg = '* ' + param + ' -';

      // Support multi-line descriptions
      if (arg.description instanceof Array) {
        argumentHelp.push(msg);
        argumentHelp.push(arg.description);
      }
      else {
        argumentHelp.push(msg + ' ' + arg.description);
      }
    });
  }

  this._help.push('');
  this._help.push('Usage:');
  this._help.push('');
  this._help.push('  ' + usage);
  this._help.push('');
  this._help.push((this.description instanceof Array ? this.description : [this.description]));
  this._help.push('');
  this._help.push([argumentHelp]);

  if (!this._hasSubcommands && this._options.length) {
    this._help.push('');
    this._help.push('Options:');
    this._help.push('');

    this._options.forEach(function (option) {
      var optionHelp = '-' + option.shortcut + ', --' + option.flag;

      if (option.value) {
        optionHelp += (option.valueRequired ? ' <' + option.value + '>' : ' [' + option.value + ']')
      }

      optionHelp += ' - ' + option.description;
      optionsHelp.push(optionHelp);
    });

    this._help.push(optionsHelp);
  }

  if (this._examples.length) {
    this._help.push('');
    this._help.push('Examples:');
    this._help.push('');
    this._help.push(this._examples);
  }

  this._help.push('');
};

/**
 * Print a custom help message to the screen
 */
LightRoast.prototype.outputHelp = function outputHelp() {
  var flattenedHelp = this._indentMessages(1, this._help, []);
  console.log(flattenedHelp.join('\n'));
};


/**
 * Recursive helper for flattening nested messages but adding the appropriate
 * spacing to them.
 */
LightRoast.prototype._indentMessages = function _indentMessages(indentationLevel, msgs, output) {
  var _this = this;
  var indentation = ' ';
  var i;

  for (i = 0; i < indentationLevel; i++) {
    indentation += indentation;
  }

  msgs.forEach(function (msg) {
    if (msg instanceof Array) {
      _this._indentMessages(indentationLevel + 1, msg, output);
    }
    else {
      output.push(indentation + msg);
    }
  });

  return output;
};

/**
 * Create a simple object with all of the options as keys so we can pass this
 * around in a more concise way than just attaching them to the commander object.
 */
LightRoast.prototype._generateOptions = function _generateOptions() {
  var _this = this;
  var opts = {};

  this._options.forEach(function (option) {
    opts[option.flag] = _this._commander[option.flag];
  });

  return opts;
};

/**
 * Parse and validate arguments
 */
LightRoast.prototype._parseArgs = function _parseArgs(args) {
  var argsValid = true;
  var requiredArgCount = this._arguments.reduce(function (prev, curr) {
     return prev + (curr.required ? 1 : 0);
  }, 0);

  if (args.length !== this._level + requiredArgCount) {
    console.log(
      '\n' +
      '\u001b[31m' +
      ' ERROR: invalid number of arguments, expected ' + requiredArgCount +
      '\u001b[39m'
    );
    return false;
  }

  args = args.slice(this._level);

  // Validate the arguments
  this._arguments.every(function (argSpec, idx) {
    if (typeof argSpec.validate === 'function' && !argSpec.validate(args[idx])) {
      argsValid = false;
      console.log('\n  ERROR: invalid argument:', argSpec.name);
      console.log(
        '\n' +
        '\u001b[31m' +
        'ERROR: invalid argument:' + argSpec.name +
        '\u001b[39m'
      );
      return false;
    }

    // Clean up the argument if there is anything to clean
    if (typeof argSpec.format === 'function') {
      args[idx] = argSpec.format(args[idx]);
    }

    return true;
  });

  // At least one argument is not valid
  if (!argsValid) {
    return false;
  }

  return args;
};

/**
 * The code to be executed once this subcommand is actually invoked
 */
LightRoast.prototype.exec = function exec(args, options, callback) {
  console.log('Command not yet implemented')
};

module.exports = LightRoast;