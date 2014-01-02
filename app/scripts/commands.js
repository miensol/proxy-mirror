(function () {

    var module = angular.module('proxyMirrorApp.commands', []);

    var shortcuts = {};

    var Commands = function ($rootScope, $injector) {

        var specialCodes = {
                63272: 'del'
            },
            getShortcutName = function (event) {
                var result = [];
                if (event.ctrlKey) {
                    result.push('ctrl');
                }
                if (event.shiftKey) {
                    result.push('shift');
                }
                var keyCode = event.keyCode;
                if (specialCodes[keyCode]) {
                    result.push(specialCodes[keyCode]);
                }
                return result.join('+').toLowerCase();
            },
            runCommand = function(commandObj){
                if(!commandObj.run || typeof commandObj.run !== 'function'){
                    throw new Error("The command for " + commandObj.shortcutName + " has no run method");
                }
                commandObj.run();
            },
            invokeCommand = function(shortcutName){
                var command = shortcuts[shortcutName];
                if(typeof command === 'function'){
                    $rootScope.$apply(function(){
                        command = $injector.instantiate(command);
                        command.shortcutName = shortcutName;
                        runCommand(command);
                    });
                } else {
                    $rootScope.$apply(function(){
                        if(!command.run || typeof command.run !== 'function'){
                            throw new Error("The command for " + shortcutName + " has no run method");
                        }
                        runCommand(command);
                    });
                }
            },
            handleKeypress = function(event){
                var shortcutName = getShortcutName(event);
                console.log('keypress', event, shortcutName);
                invokeCommand(shortcutName);
            };

        this.handleKeypress = handleKeypress;
    };


    var CommandsProvider = function () {
        var commandsInstance = null;

        this.$get = function($rootScope, $injector){
            if(commandsInstance == null){
                commandsInstance = new Commands($rootScope, $injector);
            }
            return commandsInstance;
        };

        this.registerShortcut = function (shortcut, command) {
            if (shortcuts[shortcut]) {
                throw new Error("There already is a shortcut associated with: " + shortcut);
            }
            var shortcutName = shortcut.toLowerCase();
            command.shortcutName = shortcutName;
            shortcuts[shortcutName] = command;
        };

    };

    module.provider('commands', CommandsProvider);

    module.run(function(commands){
        angular.element(document).on('keypress', commands.handleKeypress);
    });


}());
