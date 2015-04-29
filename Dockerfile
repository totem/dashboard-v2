# Totem Dashboard v2

# Use node 0.10.x
FROM totem/nodejs-base:0.10.29-trusty

# Install Gulp & bower
RUN npm install -g gulp bower

# Add files necessary for npm install (For caching purposes)
ADD package.json /opt/totem-dashboard/

# Install node modules
RUN cd /opt/totem-dashboard; rm -rf node_modules; npm install

# Update dashboard directory files
ADD . /opt/totem-dashboard

# Bower build
RUN cd /opt/totem-dashboard && \
    gulp clean && \
    bower --allow-root install

# Expose port
EXPOSE 3000

# Set discover var
ENV DISCOVER totem-dashboard:3000

WORKDIR /opt/totem-dashboard

# Set default command to gulp
ENTRYPOINT ["gulp"]

# Set default param for gulp to the output directory
CMD ["serve:dist"]
