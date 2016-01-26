# Totem Dashboard v2

# Use node 0.10.x
FROM totem/nodejs-base:0.10.29-trusty

# Install Gulp & bower
RUN npm install -g gulp bower

WORKDIR /opt/totem-dashboard

# Add files necessary for npm install (For caching purposes)
ADD package.json /opt/totem-dashboard/

# Install node modules
RUN rm -rf node_modules; npm install

# Add the package and bower files
ADD bower.json .bowerrc /opt/totem-dashboard/

# Bower build
RUN bower --allow-root install

# Update dashboard directory files
ADD . /opt/totem-dashboard

# Bower build
RUN gulp clean && gulp build

# Expose port
EXPOSE 3000

# Set discover var
ENV DISCOVER totem-dashboard:3000

# Set default command to gulp
ENTRYPOINT ["gulp"]

# Set default param for gulp to the output directory
CMD ["serve:prod"]
