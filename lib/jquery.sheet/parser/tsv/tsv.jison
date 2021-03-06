/* description: Parses a tab separated value to an array */

/* lexical grammar */
%lex
%s SINGLE_QUOTATION_ON DOUBLE_QUOTATION_ON
%%
<SINGLE_QUOTATION_ON>'"'            {return 'CHAR';}
<DOUBLE_QUOTATION_ON>"'"            {return 'CHAR';}
<DOUBLE_QUOTATION_ON>'"' {
	this.popState('DOUBLE_QUOTATION_ON');
	return 'DOUBLE_QUOTATION';
}
'"' {
	this.begin('DOUBLE_QUOTATION_ON');
	return 'DOUBLE_QUOTATION';
}
<SINGLE_QUOTATION_ON>"'" {
	this.popState('SINGLE_QUOTATION_ON');
	return 'SINGLE_QUOTATION';
}
"'" {
	this.begin('SINGLE_QUOTATION_ON');
	return 'SINGLE_QUOTATION';
}
<DOUBLE_QUOTATION_ON>(\n|"\n")      {return 'CHAR';}
<SINGLE_QUOTATION_ON>(\n|"\n")      {return 'CHAR';}
(\n|"\n")                           {return 'END_OF_LINE';}
(\t)                                {return 'COLUMN';}
(\s)								{return 'CHAR';}
.                                   {return 'CHAR';}
<<EOF>>								{return 'EOF';}


/lex

%start cells

%% /* language grammar */

cells :
	rows EOF {
        return $1;
    }
    | EOF {
        return '';
    }
;

rows :
	row {
		$$ = [$1];
	}
	| rows row {
		$1 = $1 || [];
		$1.push($2);
	}
;

row :
	END_OF_LINE {
		$$ = [];
	}
	| column {
		$$ = [$1];
	}
	| row column {
		$1 = $1 || [];
		$1.push($2);
		$$ = $1;
	}
;

column :
	COLUMN {
		$$ = '';
	}
	| string {
		$$ = $1;
    }
    | string COLUMN {
        $$ = $1;
    }
;

string :
	DOUBLE_QUOTATION chars DOUBLE_QUOTATION {
		$$ = $2;
	}
	| SINGLE_QUOTATION chars SINGLE_QUOTATION {
		$$ = $2;
	}
	| chars {
		$$ = $1;
	}
;

chars :
	CHAR {
		$$ = $1;
	}
	| chars CHAR {
		$$ = $1 + $2;
	}
;