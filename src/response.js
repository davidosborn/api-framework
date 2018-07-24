'use strict'

/**
 * A utility to create responses.
 */
export default class Response {
	static html(html) {
		header('Content-Type: text/html')
		echo(html)
	}

	static error(e) {
		if (is_int(e))
			e = new HttpException(e)
		else if (is_object(e) && !is_a(e, 'HttpException'))
			e = new HttpException(500, e)
		http_response_code(e.getCode())
		if (defined('DEBUG') && DEBUG)
			Response.json(Response._getExceptionResponse(e))
		else Response.text(e.getMessage())
	}

	static json(data) {
		header('Content-Type: application/json')
		echo(json_encode(data))
	}

	static text(s) {
		header('Content-Type: text/plain')
		echo(s)
	}

	static _getExceptionResponse(e) {
		response = {
			'class':       e.constructor.name,
			code:          e.getCode(),
			message:       e.getMessage(),
			requestMethod: server.REQUEST_METHOD,
			requestURI:    server.REQUEST_URI,
			trace:         e.getTrace()
		}

		// include location of throw in trace
		array_unshift(response.trace, {
			file: e.getFile(),
			line: e.getLine()
		})

		// include failed SQL query if available
		if (is_a(e, 'PDOException') && isset(e.errorInfo[3]))
			response.SQL = e.errorInfo[3]

		// include previous exception
		previous = e.getPrevious()
		if (isset(previous))
			response.previous = Response._getExceptionResponse(previous)

		return {
			error: response
		}
	}
}
