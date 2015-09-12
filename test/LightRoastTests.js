var expect = require('chai').expect;

describe('LightRoast', function () {

  describe('# Private Methods', function () {
    describe('roast._recursivelyBuildCommands(config)', function () {
      it('Should recursively call new LightRoast() with subcommands');
    });

    describe('roast._setup()', function () {
      it('Should do something');
    });

    describe('roast._generateHelp()', function () {
      it('Should do something');
    });

    describe('roast._indentMessages(indentationLevel, msgs, output)', function () {
      it('Should do something');
    });

    describe('roast._generateOptions()', function () {
      it('Should do something');
    });

    describe('roast._parseArgs(args)', function () {
      it('Should do something');
    });
  });

  describe('# Public Properties', function () {
    describe('roast.command', function () {
      it('Should be a string representing the name of this command');
    });

    describe('roast.description', function () {
      it('Should be a string or an array describing the command');
    });

    describe('roast.exec', function () {
      it('Should be a function to be called when this command is invoked');
    });
  });

  describe('# Public Methods', function () {
    describe('roast.constructor(name, config, commander)', function () {
      it('Should do something');
    });

    describe('roast.executableName(name)', function () {
      it('Should do something');
    });

    describe('roast.setParentCommands(commands)', function () {
      it('Should do something');
    });

    describe('roast.setLevel(level)', function () {
      it('Should do something');
    });

    describe('roast.addOptions(options)', function () {
      it('Should do something');
    });

    describe('roast.parse(argv, callback)', function () {
      it('Should do something');
    });

    describe('roast.outputHelp()', function () {
      it('Should do something');
    });

    describe('roast.exec(args, options, callback)', function () {
      it('Should do something');
    });
  });
});