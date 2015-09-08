# light-roast

A simple CLI creation tool for designing complex, mult-tiered commands with 
arguments and options.  Using the [commander](https://github.com/tj/commander.js) 
utility under the hood, this library allows for arbitrarily nested commands 
configured via a javascript object.

Create output like:

```
$> lightroast --help

  Usage:
  
    $> lightroast [options] (bootstrap|provision|deploy|destroy)
  
    The awesome utility for automated provisioning and deployment
  
        * bootstrap -
                Tools for helping create VPCs, Puppet Master/Dashboards, and Puppet Agents
        * provision -
                Once instances are bootstrapped, there needs to be a separate process
                to provision the actual VMs with required specifications to get them
                ready for use.
        * deploy -
                Deploy code to various applications such as Puppet, node, etc
        * destroy -
                Properly destroy resources from scratch, for a vpc this means:
                - NAT server
                - VPN server
                - Security groups
                - VPC

```

Automagically!

# Install

    npm install light-roast --save

# Defining a command

Commands consist of the following configuration object:

```javacript
var LightRoast = require('light-roast');
var command = new LightRoast('my-command', {
  description: [
    'A multi-line description with linebreaks after each item in the array',
    'Indentation can be made easier by using a nested array:',
    [
      '* One indented bullet',
      '* Two indented bullets'
    ]
  ],
  examples: [
    '$> my-command [options] <something> [something-else]'
  ],
  
  // Specify command-line options that take -o, --option style flags
  options: [
    {
      shortcut: 'e', // Use as -e
      flag: 'env',  // or as --env
      description: 'A description of my option',
      value: 'environment', // For the usage notes as '--option=<value>'
      valueRequired: true,
      defaultValue: 'dev'
    }
  ],
  
  // Arguments and subcommands are mutually-exclusive
  // A command cannot have both arguments and subcommands because that wouldn't
  // make any sense
  arguments: [],
  
  // 
  subcommands: {
    'my-subcommand': {

      // Commmand structure repeated here

      arguments: [
        {
          name: 'name',
          description: 'My description of the name argument',
          required: true,
          
          // Provide a custom validation function that returns true/false
          validate: function (val) {
            return /^[0-9a-z_\-]{3,10}$/.test(val);
          },
          
          // After validating, clean up the argument (typecast, etc)
          format: function (val) {
            return val;
          }
        }
      ],
      
      // For leaf-level comamnds, they should provide an exec method to act
      // on the arguments and options received (after they have been validated
      // and formatted)
      exec: function (args, opts, callback) {
        // Do something here
        callback();
      }
    }
  }
});

```

# Descriptions and Examples

One of the primary goals of this library is to provide improved help and
usage documentation for a CLI tool at every level.  For parent commands,
this means auto-generated help with explanations of sub commands in addition
to whatever description and examples that you provide.

The descriptions and examples can be arbitarily nested for indentation purposes
and each line within the description array equals one line of output.

# Options

Options mostly follow the commander standard and provide a description, a
default value, and the optional flag to indicate whether or not the option
is required.

Extra (undefined) options are not allowed.  Options are inherited from
parent commands to child commands, so an environment option specified at the
root level results in the environment option being available (or overwritten) by
all of the leaf commands.

# Arguments

Arguments are defined using the following object layout:

```javascript
var arg = {
  name: 'name', // For help purposes
  description: 'My description of the name argument',
  required: true,
  
  // Provide a custom validation function that returns true/false
  validate: function (val) {
    return /^[0-9a-z_\-]{3,10}$/.test(val);
  },
  
  // After validating, clean up the argument (typecast, etc)
  format: function (val) {
    return val;
  }
};
```

# Exec Function

As the final result of a command, the exec() method is called with the arguments,
options, and a callback.  This is where your application logic should actually
be performed.

# Examples and Tests

__TODO__

# Tutorial: Creating an Executable

__TODO__
