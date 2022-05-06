import cases from '../../case/case-routes-v0';
import contacts from '../../contact/contact-routes-v0';
const { Router } = require('express');
const postSurveys = require('./post-surveys');
const csamReports = require('./csam-reports');

const router = Router();

router.use('/contacts', contacts);
router.use('/cases', cases);
router.use('/postSurveys', postSurveys);
router.use('/csamReports', csamReports);

module.exports = router;