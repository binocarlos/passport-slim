import React, { Component, PropTypes } from 'react'
import { Route, IndexRoute } from 'react-router'
import boilerapp from 'boiler-frontend'
import Page from 'boiler-frontend/lib/components/Page'

import Dashboard from './containers/Dashboard'

boilerapp({
  appTitle:'Passport Slim Example',
  mountElement:document.getElementById('mount'),
  dashboard:Dashboard
})