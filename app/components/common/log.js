(function () {
'use strict';

/*jshint strict: true */
/*globals angular,ansiparse*/

angular.module('totemDashboard')
  .directive('log', function () {

    return {
      restrict: 'E',
      template: '<pre class="log"></pre>',
      replace: true,
      link: function postLink(scope, element) {
        var logs = '';

        scope.$watch('logs', function() {
          logs = '';
          if (typeof scope.logs === 'string') {
            logs = formatLog(scope.logs);
          } else {
            for (var key in scope.logs) {
              logs = formatLog(scope.logs[key]);
            }
          }
          initEvents();

          element.html(logs);
          initEvents();

          element.find('.fold').last().addClass('open');
          element.scrollTop(element[0].scrollHeight);
        });

        function initEvents() {
          element.find('.fold .toggle').click(function (e) {
            e.preventDefault();
            angular.element(this).parent().toggleClass('open');
          });
        }

        // Log formatting
        function formatLog(log) {
          if (!log) {
            return;
          }

          var multiLine, i;
          var foldRegex = /(\n\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})|(\n\w{3} \d{2}, \d{4})/g;


          // Add folds to the log
          log = log.replace(/</g,'&lt;');
          log = log.replace(/>/g,'&gt;');
          log = log.replace(/\[2K\r/g, ''); // Don't want to erase

          log = log.split(/\n/g);
          log = log.splice(log.length-10000, log.length);
          log = log.join('\n');

          log = log.split(/\r\n/g);

          for (i = 0; i < log.length; i += 1) {
            multiLine = log[i].split(/\n|\r/g);
            if (multiLine.length > 1) {
              // Determine what we want to be a fold
              if (multiLine.length === 2 && multiLine[1] === '') {
                log[i] = '<span class="single">' + log[i] + '</span>';
              } else {
                log[i] = '<span class="fold">' + log[i] + '<span class="arrow">&#8618;</span><span class="toggle"></span></span>';
              }

            } else {
              log[i] = '<span class="single">' + log[i] + '</span>';
            }
          }

          log = log.join('');

          // Parse ansi for colors / styles
          var
            ansi = ansiparse(log),
            classes = [],
            html = '';

          for (i = 0; i < ansi.length; i++) {
            classes = [];
            if (ansi[i].foreground) { classes.push(ansi[i].foreground); }
            if (ansi[i].background) { classes.push('bg-' + ansi[i].background); }
            if (ansi[i].bold) { classes.push('bold'); }
            if (ansi[i].italic) { classes.push('italic'); }
            if (ansi[i].underline) { classes.push('underline'); }

            if (classes.length) {
              classes = classes.join(' ');
              html += '<span class="' + classes + '">' + ansi[i].text + '</span>';
            } else {
              html += ansi[i].text;
            }
          }
          return html;
        }
      }
    };
  });
})();
